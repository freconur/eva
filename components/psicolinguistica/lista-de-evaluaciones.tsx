import { useGlobalContext } from '@/features/context/GlolbalContext'
import { usePsicolinguistica } from '@/features/hooks/usePsicolinguistica'
import CrearEvaluacionPsicolinguitica from '@/modals/crearEvaluacionPsicolinguitica'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { PiFilesFill } from 'react-icons/pi'


const ListaEvaluaciones = () => {
  const [showModal, setShowModal] = useState<boolean>(false)
  const { evaluacionesPsicolinguistica } = useGlobalContext()
  const { getPsicolinguistica } = usePsicolinguistica()
  const handleShowCrearEvaluacion = () => {
    setShowModal(!showModal)
  }


  useEffect(() => {
    getPsicolinguistica()
  }, [])
  return (
    <div className='p-10'>
      <h1 className='text-white font-martianMono font-bold text-3xl  text-center'>Psicolinguistica</h1>
      <div className="flex justify-start my-10">
        <button onClick={handleShowCrearEvaluacion} className='p-3 text-md bg-pastel13 drop-shadow-lg rounded-md hover:bg-tere hover:text-white duration-300 text-tableEstandares6 font-semibold'>crear evaluación</button>
      </div>

      {
        showModal ?
          <CrearEvaluacionPsicolinguitica handleShowCrearEvaluacion={handleShowCrearEvaluacion} />
          : null
      }

      <div>
        <ul className='grid gap-5 grid-cols-5'>
          {evaluacionesPsicolinguistica?.map((psico) => {
            return (
              <li key={psico.id} className='p-1 rounded-md bg-gradient-to-r drop-shadow-lg from-indigo-500 via-purple-500 to-pink-500 hover:opacity-80 duration-400 :hover:duration-400'>
                <Link href={`/admin/psicolinguistica/examen/${psico.id}`} className='bg-color-boton rounded-md p-3 h-full m-auto grid justify-center items-center'>
                  <div className='w-full flex items-center justify-center'>
                    <PiFilesFill className='text-[100px] text-white' />
                  </div>
                  <p className='text-lg uppercase text-cyan-100 font-semibold text-center'>{psico.nombre}</p>

                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default ListaEvaluaciones