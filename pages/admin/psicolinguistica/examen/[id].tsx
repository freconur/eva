import { useGlobalContext } from '@/features/context/GlolbalContext'
import { usePsicolinguistica } from '@/features/hooks/usePsicolinguistica'
import AgregarPreguntasPsicolinguistica from '@/modals/agregarPreguntasPsicolinguisticas'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import header from '../../../../assets/header-psico.jpg'
import Image from 'next/image'
import EvaluarEstudiantePsicolinguistica from '@/modals/evaluarEstudiantePsicolinguistica'
const ExamenPsicolinguistica = () => {

  const { getPsicolinguisticaById } = usePsicolinguistica()
  const { psicolinguisticaById, preguntasPsicolinguistica } = useGlobalContext()
  const router = useRouter()
  const [showModalAGregarPregunta, setShowModalAGregarPregunta] = useState<boolean>(false)
  const [showModalEvaluar, setShowModalEvaluar] = useState<boolean>(false)


//FUNCION PARA 
  //BOTONES PARA MOSTRAR LOS MODALES
  const handleShowModalAgregarPregunta = () => {
    setShowModalAGregarPregunta(!showModalAGregarPregunta)
  }
  const handleShowModalEvaluar = () => {
    setShowModalEvaluar(!showModalEvaluar)
  }
  //BOTONES PARA MOSTRAR LOS MODALES

  //CARGA DE VALORES DE INICIO
  useEffect(() => {
    getPsicolinguisticaById(`${router.query.id}`)
  }, [router.query.id])
  //CARGA DE VALORES DE INICIO
  return (
    <div className=''>
      {showModalEvaluar && <EvaluarEstudiantePsicolinguistica handleShowModalEvaluar={handleShowModalEvaluar} id={`${router.query.id}`} preguntasPsicolinguistica={preguntasPsicolinguistica} />}
      {
        showModalAGregarPregunta && <AgregarPreguntasPsicolinguistica id={`${router.query.id}`} handleShowModalAgregarPregunta={handleShowModalAgregarPregunta} />
      }
      <div className='flex relative justify-between p-20 bg-headerPsicolinguistica overflow-hidden'>
        <Image
          className='absolute bottom-0 top-[-250px] right-0 left-0 z-1 opacity-30'
          src={header}
          alt="imagen de cabecera"
          objectFit='fill'
          priority
        />
        <h1 className="text-textTitulos relative z-[20] text-3xl font-bold font-martianMono capitalize text-center">{psicolinguisticaById.nombre}</h1>
        <button onClick={handleShowModalAgregarPregunta} className='p-3 bg-gradient-to-r from-colorTercero to-colorSecundario  text-textTitulos  rounded-sm drop-shadow-lg '>Agregar preguntas</button>
      </div>
      <div className='w-full bg-amarilloLogo'>
        <div className='m-auto w-[1000px] flex justify-between items-center'>
          <h2 className='text-2xl text-textTitulos capitalize py-5 '>preguntas</h2>
          <button onClick={handleShowModalEvaluar} className='p-3 bg-gradient-to-r from-colorTercero to-colorSecundario  text-textTitulos  rounded-sm drop-shadow-lg '>Evaluar estudiante</button>
        </div>
      </div>
      <div className='m-auto w-[1000px]'>
        <ul className='grid gap-6'>
          {preguntasPsicolinguistica?.map(pregunta => {
            return (
              <li key={pregunta.order} className='flex gap-2'>
                <p className='text-lg text-textTitulos'>{pregunta.order}.</p>
                <p className='text-lg text-textTitulos text-justify'>
                  {pregunta.pregunta}
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