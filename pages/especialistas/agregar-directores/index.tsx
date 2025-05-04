import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import SearchUsuarios from '@/components/searchUsuarios'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import DeleteUsuario from '@/modals/deleteUsuario'
import UpdateUsuarioDirector from '@/modals/updateUsuarioDirector'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdDeleteForever, MdEditSquare } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'
import { ToastContainer, toast } from 'react-toastify';
const AgregarDirectores = () => {

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const { getUserData, createNewDirector, getRegiones, getUsersDirectores } = useUsuario()
  const { currentUserData, regiones, loaderPages, usuariosDirectores, warningUsuarioExiste, dataDirector, warningUsuarioNoEncontrado } = useGlobalContext()
  const [showModal, setShowModal] = useState<boolean>(false)
  const [idUsuario, setIdUsuario] = useState<string>("")
  const[showDeleteUsuario, setShowDeleteUsuario] = useState<boolean>(false)
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
  const handleShowModalDelete = () => {
    setShowDeleteUsuario(!showDeleteUsuario)
  }
  const handleShowModal = () => {
    setShowModal(!showModal)
  }
  console.log('warningUsuarioNoEncontrado', warningUsuarioNoEncontrado)
  return (
    <>
      <ToastContainer />
    <div className='grid grid-cols-2 w-[1100px] p-1 place-content-center mt-5 m-auto'>
      {
        showModal &&
        <UpdateUsuarioDirector idUsuario={idUsuario} handleShowModal={handleShowModal} />
      }
      {
        showDeleteUsuario &&
        <DeleteUsuario idUsuario={idUsuario} handleShowModalDelete={handleShowModalDelete}/>
      }
      <div className='p-5'>
        <div className='w-ful w-[500px] '>
          <h1 className='text-colorTercero font-semibold text-3xl font-mono mb-10 capitalize'>Usuarios de directores</h1>
          <SearchUsuarios />
          {
            warningUsuarioNoEncontrado.length > 0 ?
              <table className='w-full  bg-white  rounded-md shadow-md mb-5'>
                <thead className='bg-azul-claro4 border-b-2 border-blue-300 '>
                  <tr className='text-white capitalize font-nunito '>
                    <th className="uppercase  pl-1 md:pl-2 px-1 text-center">Mensaje</th>

                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className=' text-slate-500 pl-1 md:pl-2 px-1 text-center'>{warningUsuarioNoEncontrado}</td>

                  </tr>
                </tbody>
              </table>
              :

              Object.keys(dataDirector).length !== 0 ?
                <table className='w-full  bg-white  rounded-md shadow-md mb-5'>
                  <thead className='bg-azul-claro4 border-b-2 border-blue-300 '>
                    <tr className='text-white capitalize font-nunito '>
                      <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
                      <th className="py-3 md:p-2  text-left">dni</th>
                      <th className="py-3 md:p-2  text-left">nombre de evaluación</th>
                      <th className="py-3 md:p-2  text-left"></th>
                      <th className="py-3 md:p-2  text-left"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>1</td>
                      <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{dataDirector.dni}</td>
                      <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{dataDirector.nombres} {dataDirector.apellidos}</td>
                      {
                        dataDirector.rol === 2 &&
                        <td className='text-center flex items-center justify-center'>
                          <MdEditSquare onClick={() => { handleShowModal(); setIdUsuario(`${dataDirector.dni}`) }} className='text-xl text-yellow-500 cursor-pointer' />
                        </td>
                      }
                      {
                        dataDirector.rol === 2 &&
                        <td className='text-center flex items-center justify-center'>
                          <MdDeleteForever onClick={() => { handleShowModalDelete();  setIdUsuario(`${dataDirector.dni}`) }} className='text-xl text-red-500 cursor-pointer' />
                        </td>
                      }
                    </tr>
                  </tbody>
                </table>
                :
                null
          }
          <table className='w-full  bg-white  rounded-md shadow-md'>
            <thead className='bg-azul-claro4 border-b-2 border-blue-300 '>
              <tr className='text-white capitalize font-nunito '>
                <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
                <th className="py-3 md:p-2  text-left">dni</th>
                <th className="py-3 md:p-2  text-left">nombre de evaluación</th>
                <th className="py-3 md:p-2  text-left"></th>
                <th className="py-3 md:p-2  text-left"></th>

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
                        <td>
                          <MdEditSquare onClick={() => { handleShowModal(); setIdUsuario(`${director.dni}`) }} className='text-xl text-yellow-500 cursor-pointer' />
                        </td>
                        <td>
                              <MdDeleteForever onClick={() => { handleShowModalDelete();  setIdUsuario(`${director.dni}`) }} className='text-xl text-red-500 cursor-pointer' />
                            </td>
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
                <form onSubmit={handleAgregarDirector}>
                  <div className='w-full my-2'>
                    <label className='text-slate-400 text-sm uppercase block mb-1'>nombre de la i.e.:</label>
                    <input
                      {...register("institucion",
                        {
                          required: { value: true, message: "El nombre de la institución es requerido" },
                          minLength: { value: 5, message: "El nombre debe tener mínimo 5 caracteres" },
                          maxLength: { value: 100, message: "El nombre debe tener máximo 100 caracteres" },
                        }
                      )}
                      className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                      type="text"
                      placeholder="Nombre de la institución"
                    />
                    {errors.institucion && <span className='text-red-400 text-sm block mt-1'>{errors.institucion.message as string}</span>}
                  </div>
                  <div className='w-full my-2'>
                    <label className='text-slate-400 text-sm uppercase block mb-1'>código modular:</label>
                    <input
                      {...register("modular",
                        {
                          required: { value: true, message: "El código modular es requerido" },
                          minLength: { value: 8, message: "El código modular debe tener 8 caracteres" },
                          maxLength: { value: 8, message: "El código modular debe tener 8 caracteres" },
                          pattern: {
                            value: /^[0-9]{8}$/,
                            message: "El código modular debe contener solo números"
                          }
                        }
                      )}
                      className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                      type="text"
                      placeholder="Número modular"
                    />
                    {errors.modular && <span className='text-red-400 text-sm block mt-1'>{errors.modular.message as string}</span>}
                  </div>
                  <div className='w-full my-2'>
                    <label className='text-slate-400 text-sm uppercase block mb-1'>dni:</label>
                    <input
                      {...register("dni",
                        {
                          required: { value: true, message: "El DNI es requerido" },
                          minLength: { value: 8, message: "El DNI debe tener 8 caracteres" },
                          maxLength: { value: 8, message: "El DNI debe tener 8 caracteres" },
                          pattern: {
                            value: /^[0-9]{8}$/,
                            message: "El DNI debe contener solo números"
                          }
                        }
                      )}
                      className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                      type="text"
                      placeholder="Número de DNI"
                    />
                    {errors.dni && <span className='text-red-400 text-sm block mt-1'>{errors.dni.message as string}</span>}
                  </div>
                  <div className='w-full my-2'>
                    <label className='text-slate-400 text-sm uppercase block mb-1'>ugel:</label>
                    <select
                      {...register("region",
                        {
                          required: { value: true, message: "La UGEL es requerida" },
                        }
                      )}
                      className='w-full p-3 rounded-md bg-white text-slate-400 shadow-md outline-none'
                    >
                      <option value="">--SELECCIONE UGEL--</option>
                      {regiones?.map((region, index) => (
                        <option key={index} value={Number(region.codigo)}>{region.region?.toUpperCase()}</option>
                      ))}
                    </select>
                    {errors.region && <span className='text-red-400 text-sm block mt-1'>{errors.region.message as string}</span>}
                  </div>
                  <div className='w-full my-2'>
                    <label className='text-slate-400 text-sm uppercase block mb-1'>nombres:</label>
                    <input
                      {...register("nombres",
                        {
                          required: { value: true, message: "Los nombres son requeridos" },
                          minLength: { value: 2, message: "Los nombres deben tener mínimo 2 caracteres" },
                          maxLength: { value: 40, message: "Los nombres deben tener máximo 40 caracteres" },
                          pattern: {
                            value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/,
                            message: "Los nombres solo pueden contener letras"
                          }
                        }
                      )}
                      className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                      type="text"
                      placeholder="Nombres del director"
                    />
                    {errors.nombres && <span className='text-red-400 text-sm block mt-1'>{errors.nombres.message as string}</span>}
                  </div>
                  <div className='w-full my-2'>
                    <label className='text-slate-400 text-sm uppercase block mb-1'>apellidos:</label>
                    <input
                      {...register("apellidos",
                        {
                          required: { value: true, message: "Los apellidos son requeridos" },
                          minLength: { value: 2, message: "Los apellidos deben tener mínimo 2 caracteres" },
                          maxLength: { value: 40, message: "Los apellidos deben tener máximo 40 caracteres" },
                          pattern: {
                            value: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/,
                            message: "Los apellidos solo pueden contener letras"
                          }
                        }
                      )}
                      className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                      type="text"
                      placeholder="Apellidos del director"
                    />
                    {errors.apellidos && <span className='text-red-400 text-sm block mt-1'>{errors.apellidos.message as string}</span>}
                  </div>
                  {warningUsuarioExiste?.length > 0 && (
                    <div className='my-2 p-2 bg-yellow-100 rounded-md'>
                      <p className='text-yellow-700 font-semibold text-center'>{warningUsuarioExiste}</p>
                    </div>
                  )}
                  <button 
                    type="submit"
                    className='flex justify-center items-center bg-blue-500 hover:bg-blue-600 duration-300 p-3 rounded-md w-full text-white hover:text-white uppercase font-semibold mt-4'
                  >
                    {loaderPages ? (
                      <div className="flex items-center">
                        <RiLoader4Line className="animate-spin mr-2" />
                        <span>Registrando...</span>
                      </div>
                    ) : (
                      "Registrar Director"
                    )}
                  </button>
                </form>
              </div>
            </div>

        }
      </div>

    </div>
    </>
  )
}


export default AgregarDirectores
AgregarDirectores.Auth = PrivateRouteEspecialista