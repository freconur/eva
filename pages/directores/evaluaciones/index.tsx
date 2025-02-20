import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import Link from 'next/link'
import styles from './evaluaciones.module.css'
import React, { useEffect } from 'react'
import { RiLoader4Line } from 'react-icons/ri'

const Evaluaciones = () => {
  const { getEvaluaciones } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages } = useGlobalContext()

  useEffect(() => {
    getEvaluaciones()
  }, [])

  console.log('evaluaciones', evaluaciones)
  return (
    <>
      {
        loaderPages ?
          <div className='grid grid-rows-loader'>
            <div className='flex justify-center items-center'>
              <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
              <span className='text-colorTercero animate-pulse'>...cargando</span>
            </div>
          </div>

          :
          <div className='grid justify-center items-center relative mt-3'>
            <div className='w-[1024px] bg-white  p-20'>
              <h1 className='text-colorSexto font-semibold text-3xl font-mono mb-10 capitalize'>evaluaciones</h1>
              <table className='w-full  bg-white  rounded-md shadow-md'>
                <thead className='bg-colorSegundo border-b-2 border-blue-300 '>
                  <tr className='text-white capitalize font-nunito '>
                    <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
                    <th className="py-3 md:p-2  text-left">nombre de evaluación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {
                    evaluaciones.length > 0 ?
                      evaluaciones?.map((eva, index) => {
                        return (
                          <tr key={index} className='h-[60px] hover:bg-blue-100 duration-300 cursor-pointer'>
                            <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>
                              <Link href={`/directores/evaluaciones/evaluacion/${eva.id}`}>
                                {index + 1}
                              </Link>
                            </td>
                            <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>
                              <Link href={`/directores/evaluaciones/evaluacion/${eva.id}`}>
                                {eva.nombre}
                              </Link>
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

      }
    </>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteDirectores