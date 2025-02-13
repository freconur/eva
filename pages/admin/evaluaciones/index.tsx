import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import Link from 'next/link'
import React, { useEffect } from 'react'

const Evaluaciones = () => {
  const { getEvaluaciones } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData } = useGlobalContext()

  useEffect(() => {
    getEvaluaciones()
  }, [currentUserData.dni])

  console.log('evaluaciones', evaluaciones)
  return (
    <div className='p-20'>
      <h1 className='text-blue-500 font-semibold text-2xl font-mono mb-10'>Mis Evaluaciones</h1>
      <ul className='grid gap-5'>
        {
          evaluaciones?.map((eva, index) => {
            return (
              <li key={index} className="text-slate-400 text-xl">
                <Link href={`/admin/evaluaciones/evaluacion/${eva.id}`}>
                  {index + 1}. {eva.nombre}
                </Link>
              </li>
            )
          })
        }
      </ul>
    </div>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteAdmin