import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { categoriaTransform } from '@/fuctions/categorias'
import { convertGrade } from '@/fuctions/regiones'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { PiFilesFill } from 'react-icons/pi'

const Pruebas = () => {
  const { evaluacionesGradoYCategoria } = useGlobalContext()
  const { getEvaluacionesGradoYCategoria } = useAgregarEvaluaciones()
  const route = useRouter()
  useEffect(() => {
    getEvaluacionesGradoYCategoria(Number(route.query.grado), Number(route.query.categoria))
  }, [route.query.grado, route.query.categoria])
  return (

    <div className='p-10'>
      <div className='w-full border-b-[2px] border-orange-300 pb-5'>
        <h1 className='text-3xl font-martianMono text-white text-center capitalize font-bold'>{convertGrade(`${route.query.grado}`)}: {categoriaTransform(Number(route.query.categoria))}</h1>
      </div>
      <div className='p-10'>
        <ul className='grid gap-5 grid-cols-5'>
          {
            evaluacionesGradoYCategoria?.map((eva, index) => {
              return (
                <li key={index} className='p-1 rounded-md bg-gradient-to-r drop-shadow-lg from-indigo-500 via-purple-500 to-pink-500 hover:opacity-80 duration-400 :hover:duration-400'>
                  <Link href={`pruebas/prueba?idExamen=${eva.id}`} className='bg-color-boton rounded-md p-3 h-full m-auto grid justify-center items-center'>
                    <div className='w-full flex items-center justify-center'>
                      <PiFilesFill className='text-[100px] text-white' />
                    </div>
                    <p className='text-lg uppercase text-cyan-100 font-semibold text-center'>{eva.nombre}</p>

                  </Link>
                </li>
              )
            })
          }
        </ul>
      </div>
    </div>

  )
}

export default Pruebas