import PrivateRoute from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import React, { useEffect } from 'react'

const MiCuenta = () => {

  const { currentUserData } = useGlobalContext()


  useEffect(() => {

  }, [currentUserData.dni])
  return (
    <div className='grid justify-center items-center relative mt-3'>
      <div className='w-[1024px] bg-white  p-20'>
          <h3 className='uppercase font-semibold text-xl text-colorSegundo mb-3'>mi cuenta</h3>
          <div className='border-b-[2px] border-t-[2px] p-3 border-colorTercero'>
            <h4 className='capitalize font-semibold text-blue-500'>mis datos</h4>
            <p className='text-md text-slate-500 capitalize '><span className='font-bold'>Nombre completo: </span>
              {currentUserData.nombres} {currentUserData.apellidos}
            </p>
            <p className='text-md text-slate-500 capitalize '>
              <span className='font-bold'>id: </span>{currentUserData.dni}
            </p>
            <p className='text-md text-slate-500 capitalize '>
              <span className='font-bold'>cargo: </span><span>{currentUserData.perfil?.nombre}</span>
            </p>
            <p className='text-md text-slate-500 '>
              <span className='font-bold capitalize'>usuario: </span>{currentUserData.dni}
            </p>
            <p className='text-md text-slate-500 '>
              <span className='font-bold capitalize'>institución: </span>{currentUserData.institucion}
            </p>
            <p className='text-md text-slate-500 capitalize'>
              {/* <span className='font-bold capitalize'>nombre de institución: </span>{currentUserData.} */}
            </p>
          </div>
      </div>
    </div>
  )
}

export default MiCuenta
MiCuenta.Auth = PrivateRoute