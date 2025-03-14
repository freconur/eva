import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import DeleteEvaluacion from '@/modals/deleteEvaluacion'
import UpdateEvaluacion from '@/modals/updateEvaluacion'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { MdDeleteForever, MdEditSquare } from 'react-icons/md'

const EvaluacionesDirector = () => {
  const { getEvaluacionesDirector } = useAgregarEvaluaciones()
  const { evaluacionesDirector, evaluacion } = useGlobalContext()
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [idEva, setIdEva] = useState<string>("")
  const [nameEva, setNameEva] = useState<string>("")
  const [inputUpdate, setInputUpdate] = useState<boolean>(false)
  const handleShowInputUpdate = () => { setInputUpdate(!inputUpdate) }
  const handleShowModalDelete = () => { setShowDelete(!showDelete) }
  useEffect(() => {
    //aqui incovaremos la fiuncion que traera las evaluaciones que fuerionb creadfas por el diurector
    getEvaluacionesDirector()
  }, [])

  // console.log('evaluacionesDirector', evaluacionesDirector)
  // console.log('idEvaDirector', idEva)
  return (
    // <div className='grid justify-center items-center relative mt-3'>
    <div className=' relative mt-3 w-[522px]'>
      {showDelete && <DeleteEvaluacion handleShowModalDelete={handleShowModalDelete}  idEva={idEva} />}
      {inputUpdate && nameEva.length > 0 && <UpdateEvaluacion evaluacion={evaluacion} nameEva={nameEva} handleShowInputUpdate={handleShowInputUpdate} idEva={idEva} />}
      <div className='w-full'>
        <h1 className='text-colorTercero font-semibold text-3xl font-mono mb-10'>Mis evaluaciones</h1>
        <table className='w-full  bg-white  rounded-md shadow-md'>
          <thead className='bg-colorSegundo border-b-2 border-blue-300 '>
            <tr className='text-white capitalize font-nunito '>
              <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
              <th className="py-3 md:p-2  text-left">nombre de evaluación</th>
              <th className="py-3 md:p-2  text-left"></th>
              <th className="py-3 md:p-2  text-left"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {
              evaluacionesDirector?.length > 0 ?
                evaluacionesDirector?.map((eva, index) => {
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
                      <td>
                        <MdEditSquare onClick={() => { setNameEva(`${eva.nombre}`); handleShowInputUpdate(); setIdEva(`${eva.id}`) }} className='text-xl text-yellow-500 cursor-pointer' />
                      </td>
                      <td>
                        <MdDeleteForever onClick={() => { handleShowModalDelete(); setIdEva(`${eva.id}`) }} className='text-xl text-red-500 cursor-pointer' />
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
  )
}

export default EvaluacionesDirector