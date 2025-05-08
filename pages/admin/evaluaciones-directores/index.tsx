import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import header from '../../../assets/evaluacion-docente.jpg'
import CrearEvaluacionDocente from '@/modals/crearEvaluacionDocente'
import UseEvaluacionDocentes from '@/features/hooks/UseEvaluacionDocentes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { MdDeleteForever, MdEditSquare } from 'react-icons/md'
import DeleteEvaluacionDocente from '@/modals/DeleteEvaluacionDocente'
import Link from 'next/link'
import { RiLoader4Line } from 'react-icons/ri'
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import UseEvaluacionDirectores from '@/features/hooks/UseEvaluacionDirectores'
import DeleteEvaluacionDirector from '@/modals/DeleteEvaluacionDirector'
import CrearEvaluacionDirector from '@/modals/crearEvaluacionDirector'

const EvaluacionesDesempeñoDocentes = () => {
  const { getEvaluacionesDirectores } = UseEvaluacionDirectores()
  const { evaluacionDesempeñoDocente, getPreguntaRespuestaDocentes, loaderPages } = useGlobalContext()
  const [showModalCrearEvaluacion, setShowCrearEvaluacion] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  const handleShowModalCrearEvaluacion = () => {
    setShowCrearEvaluacion(!showModalCrearEvaluacion)
  }

  useEffect(() => {
    getEvaluacionesDirectores()
  }, [])

  return (
    <div className=''>
      {showDelete && <DeleteEvaluacionDirector handleShowModalDelete={handleShowModalDelete} idEva={idEva} />}
      {showModalCrearEvaluacion && <CrearEvaluacionDirector handleShowModalCrearEvaluacion={handleShowModalCrearEvaluacion} />}

      {/* <h1 className='font-martianMono uppercase text-xl font-semibold text-slate-600'>Seguimiento del desempeño del docente</h1> */}
      <div className=''>
        <div className='grid relative xxl:flex gap-[20px] justify-between p-20 bg-headerPsicolinguistica overflow-hidden mb-5 '>
          <div className='top-0 bottom-0 rigth-0 left-0 bg-blue-600 z-[15] absolute w-full opacity-30'></div>

          <Image
            // className='absolute object-cover bottom-0 top-[-250px] right-0 left-0 z-1 opacity-1'
            className="absolute object-cover h-[100%] w-full bottom-0 top-[0px] right-0 left-0 z-[10] opacity-80"
            src={header}
            alt="imagen de cabecera"
            objectFit='fill'
            priority
          />
          <h1 className="text-textTitulos relative z-[20]  text-3xl font-bold font-martianMono capitalize text-left">Evaluaciones de seguimiento de desempeño del director</h1>
          <button onClick={handleShowModalCrearEvaluacion} className="relative z-[50] p-3 rounded-sm bg-green-400 text-textTitulos w-[150px] h-[50px]">Crear Evaluación</button>
        </div>

        {
          loaderPages ?
            <div className="flex w-full mt-5 items-center m-auto justify-center">
              <RiLoader4Line className="animate-spin text-3xl text-slate-500 " />
              <p className="text-slate-500">buscando resultados...</p>
            </div>
            :

            <div className='p-5'>
              <table className='w-full  bg-white  rounded-md drop-shadow-lg overflow-hidden'>
                <thead className='bg-colorSegundo border-b-2 border-blue-300 '>
                  <tr className='text-white capitalize font-nunito '>
                    <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
                    <th className="py-3 md:p-2  text-left">nombre de evaluación</th>
                    <th className="py-3 md:p-2  text-left">categorias</th>
                    <th className="py-3 md:p-2  text-left"></th>
                    <th className="py-3 md:p-2  text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {
                    evaluacionDesempeñoDocente?.map((evaluacion, index) => {
                      return (
                        <tr key={index} className='h-[60px] hover:bg-blue-100 duration-300 cursor-pointer'>
                          <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>
                            <Link href={`/admin/evaluaciones-directores/evaluacion/${evaluacion.id}`}>
                              {index + 1}
                            </Link>
                          </td>
                          <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>
                            <Link href={`/admin/evaluaciones-directores/evaluacion/${evaluacion.id}`}>
                              {evaluacion.name}
                            </Link>
                          </td>
                          <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>
                            <Link href={`/admin/evaluaciones-directores/evaluacion/${evaluacion.id}`}>
                              {evaluacion.categoria}
                            </Link>
                          </td>
                          <td>
                            {<MdEditSquare onClick={() => { setNameEva(`${evaluacion.name}`); handleShowInputUpdate(); setIdEva(`${evaluacion.id}`) }} className='text-xl text-yellow-500 cursor-pointer' />}
                          </td>
                          <td>
                            <MdDeleteForever onClick={() => { handleShowModalDelete(); setIdEva(`${evaluacion.id}`) }} className='text-xl text-red-500 cursor-pointer' />
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
        }

      </div>
    </div>
  )
}

export default EvaluacionesDesempeñoDocentes
// EvaluacionesDesempeñoDocentes.Auth = PrivateRouteAdmins