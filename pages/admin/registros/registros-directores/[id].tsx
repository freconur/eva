import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useRegistros } from '@/features/hooks/useRegistros'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const RegistroDirectores = () => {

const { currentUserData, docentesDeDirectores } = useGlobalContext()
const { getDocentesDeDirectores } = useRegistros()
  const route = useRouter()
  useEffect(() => {
    getDocentesDeDirectores(`${route.query.id}`)
  },[currentUserData.dni, route.query.id])

  console.log('route.query.id', route.query.id)
  console.log('docentesDeDirectores', docentesDeDirectores)
  return (
    <div className='p-10'>
      <div className='text-2xl text-colorSecundario uppercase mb-10'>Docentes</div>
      <div>
        <table className='w-full  bg-white  rounded-md shadow-md relative'>
          <thead className='bg-blue-700 border-b-2 border-blue-300 '>
            <tr className='text-white capitalize font-nunito '>
            <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
            <th className="uppercase  pl-1 md:pl-2 px-1 text-left">dni</th>
            <th className="py-3 md:p-2 pl-1 md:pl-2 text-left ">descripcion</th>
            <th className="py-3 md:p-2  text-white text-left">institución educativa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {
              docentesDeDirectores.map((doc, index) => {
                return (
                  <tr key={index} className='h-[60px] hover:bg-blue-100 duration-100 cursor-pointer'>
                    <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>
                      <Link href={``}>
                      {index + 1}
                      </Link>
                      </td>
                    <td  className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{doc.dni}</td>
                    <td  className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{doc.nombres} {doc.apellidos}</td>
                    <td  className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{doc.institucion}</td>
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

export default RegistroDirectores
RegistroDirectores.Auth = PrivateRouteAdmin