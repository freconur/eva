import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useRegistros } from '@/features/hooks/useRegistros'
import React, { useEffect } from 'react'

const Registros = () => {

  const { getDirectores } = useRegistros()
  const { directores } = useGlobalContext()
  useEffect(() => {
    getDirectores()
  },[])

  console.log('directores', directores)
  return (
    <div className='p-10'>
      <h1 className='text-2xl text-slate-500 font-semibold uppercase mb-10'>mis registros</h1>
      <div>
        <table className='w-full  bg-white  rounded-md shadow-md relative'>
          <thead className='bg-blue-700 border-b-2 border-blue-300 '>
            <tr className='text-white capitalize font-nunito '>
            <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
            <th className="py-3 md:p-2 pl-1 md:pl-2 text-left ">descripcion</th>
            <th className="py-3 md:p-2  text-left">institución educativa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {
              directores.map((dir, index) => {
                return (
                  <tr key={index} className='h-[60px] hover:bg-blue-100 duration-100 cursor-pointer'>
                    <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>{index + 1}</td>
                    <td  className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{dir.nombres} {dir.apellidos}</td>
                    <td  className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{dir.institucion}</td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Registros
Registros.Auth = PrivateRouteAdmin