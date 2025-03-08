import { useGlobalContext } from '@/features/context/GlolbalContext'
import { usePsicolinguistica } from '@/features/hooks/usePsicolinguistica'
import AgregarPreguntasPsicolinguistica from '@/modals/agregarPreguntasPsicolinguisticas'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const ExamenPsicolinguistica = () => {

  const { getPsicolinguisticaById } = usePsicolinguistica()
  const { psicolinguisticaById, preguntasPsicolinguistica } = useGlobalContext()
  const router = useRouter()
  const [showModalAGregarPregunta, setShowModalAGregarPregunta] = useState<boolean>(false)


  const handleShowModalAgregarPregunta = () => {
    setShowModalAGregarPregunta(!showModalAGregarPregunta)
  }
  useEffect(() => {
    getPsicolinguisticaById(`${router.query.id}`)
  }, [router.query.id])
  return (
    <div className=''>
      {
        showModalAGregarPregunta && <AgregarPreguntasPsicolinguistica id={`${router.query.id}`} handleShowModalAgregarPregunta={handleShowModalAgregarPregunta} />
      }
      <div className='flex justify-between p-20 bg-headerPsicolinguistica mb-10'>
        <h1 className="text-textTitulos text-3xl font-bold font-martianMono capitalize text-center">{psicolinguisticaById.nombre}</h1>
        <button onClick={handleShowModalAgregarPregunta} className='p-3 bg-gradient-to-r from-colorTercero to-colorSecundario  text-textTitulos  rounded-sm drop-shadow-lg '>Agregar preguntas</button>
      </div>

      <div className='m-auto w-[1000px]'>
        <h2 className='text-2xl text-ggw-3 capitalize mb-10'>preguntas</h2>
        <ul className='grid gap-6'>
          {preguntasPsicolinguistica?.map(pregunta => {
            return (
              <li key={pregunta.order}>
                <p className='text-lg text-azul-claro2'>
                {pregunta.order}. {pregunta.pregunta}
                </p>
                </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default ExamenPsicolinguistica