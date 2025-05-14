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
import { rolDirectivo, genero,caracteristicasDirectivo } from '@/fuctions/regiones'
import {provinciasPuno, distritosPuno} from '@/fuctions/provinciasPuno'
import UsuariosByRol from '@/components/usuariosByRol'
import TablaUsuarios from '@/components/curricular/tablas/tablaUsuarios'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import TablaUsuariosAdminEspecialistas from '@/components/curricular/tablas/tablaUsuariosAdmin'
const AgregarDirectores = () => {

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const { getUserData, createNewDirector, getRegiones, getUsersDirectores } = useUsuario()
  const { currentUserData, regiones, loaderPages, usuariosDirectores, warningUsuarioExiste, dataDirector, warningUsuarioNoEncontrado, docentesDeDirectores } = useGlobalContext()
  const {  getDocentesFromDirectores, getUsuariosToAdmin} = useEvaluacionCurricular()
  const [showModal, setShowModal] = useState<boolean>(false)
  const [idUsuario, setIdUsuario] = useState<string>("")
  const [showDeleteUsuario, setShowDeleteUsuario] = useState<boolean>(false)
  const [distritos, setDistritos] = useState<string[]>([])

  const regionSeleccionada = watch("region")

  useEffect(() => {
    getUserData()
    getRegiones()
    if(currentUserData.rol === 4){
      getUsuariosToAdmin(2)
    } else {
      getDocentesFromDirectores(Number(currentUserData.region), `${currentUserData.dni}`)
    }
    /* getUsersDirectores() */
  }, [currentUserData.dni])

  useEffect(() => {
    if (regionSeleccionada) {
      const provinciaEncontrada = distritosPuno.find(prov => prov.id === Number(regionSeleccionada))
      if (provinciaEncontrada) {
        setDistritos(provinciaEncontrada.distritos)
      }
    } else {
      setDistritos([])
    }
  }, [regionSeleccionada])

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
  console.log('docentesDeDirectores', docentesDeDirectores)
  /* console.log('usuariosDirectores', usuariosDirectores) */
  return (
    <>
      <ToastContainer />
    <div className='flex p-1 place-content-center mt-5 m-auto'>
      {
        showModal &&
        <UpdateUsuarioDirector idUsuario={idUsuario} handleShowModal={handleShowModal} />
      }
      {
        showDeleteUsuario &&
        <DeleteUsuario idUsuario={idUsuario} handleShowModalDelete={handleShowModalDelete}/>
      }
      <div className='p-5'>
        <div className='w-full '>
          <h1 className='text-colorTercero font-semibold text-3xl font-mono mb-10 capitalize'>Directivos</h1>
          <TablaUsuariosAdminEspecialistas rol={2} docentesDeDirectores={docentesDeDirectores}/>
        </div>
      </div>
      <div className=' p-5 rounded-sm shadow-md '>
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

              <h1 className='text-colorTercero font-semibold text-3xl font-mono mb-10 capitalize'>Registrar Directivo</h1>
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
                    <label className='text-slate-400 text-sm uppercase block mb-1'>distrito:</label>
                    <select
                      {...register("distrito",
                        {
                          required: { value: true, message: "El distrito es requerido" },
                        }
                      )}
                      className='w-full p-3 rounded-md bg-white text-slate-400 shadow-md outline-none'
                      disabled={!regionSeleccionada}
                    >
                      <option value="">--SELECCIONE DISTRITO--</option>
                      {distritos.map((distrito, index) => (
                        <option key={index} value={distrito}>{distrito.toUpperCase()}</option>
                      ))}
                    </select>
                    {errors.distrito && <span className='text-red-400 text-sm block mt-1'>{errors.distrito.message as string}</span>}
                  </div>

                  <div className='w-full my-2'>
                    <label className='text-slate-400 text-sm uppercase block mb-1'>rol directivo:</label>
                    <select
                      {...register("rolDirectivo",
                        {
                          required: { value: true, message: "El rol directivo es requerido" },
                        }
                      )}
                      className='w-full p-3 rounded-md bg-white text-slate-400 shadow-md outline-none'
                    >
                      <option value="">--SELECCIONE ROL--</option>
                      {rolDirectivo?.map((rol, index) => (
                        <option key={index} value={rol.id}>{rol.name.toUpperCase()}</option>
                      ))}
                    </select>
                    {errors.rolDirectivo && <span className='text-red-400 text-sm block mt-1'>{errors.rolDirectivo.message as string}</span>}
                  </div>

                  <div className='w-full my-2'>
                    <label className='text-slate-400 text-sm uppercase block mb-1'>género:</label>
                    <select
                      {...register("genero",
                        {
                          required: { value: true, message: "El género es requerido" },
                        }
                      )}
                      className='w-full p-3 rounded-md bg-white text-slate-400 shadow-md outline-none'
                    >
                      <option value="">--SELECCIONE GÉNERO--</option>
                      {genero?.map((gen, index) => (
                        <option key={index} value={gen.id}>{gen.name.toUpperCase()}</option>
                      ))}
                    </select>
                    {errors.genero && <span className='text-red-400 text-sm block mt-1'>{errors.genero.message as string}</span>}
                  </div>

                  <div className='w-full my-2'>
                    <label className='text-slate-400 text-sm uppercase block mb-1'>característica:</label>
                    <select
                      {...register("caracteristica",
                        {
                          required: { value: true, message: "La característica es requerida" },
                        }
                      )}
                      className='w-full p-3 rounded-md bg-white text-slate-400 shadow-md outline-none'
                    >
                      <option value="">--SELECCIONE CARACTERÍSTICA--</option>
                      {caracteristicasDirectivo?.map((caract, index) => (
                        <option key={index} value={caract.id}>{caract.name.toUpperCase()}</option>
                      ))}
                    </select>
                    {errors.caracteristica && <span className='text-red-400 text-sm block mt-1'>{errors.caracteristica.message as string}</span>}
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