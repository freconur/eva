import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { Alternativas } from '@/features/types/types'
import AgregarPreguntasRespuestas from '@/modals/agregarPreguntasYRespuestas'
import EvaluarEstudiante from '@/modals/evaluarEstudiante'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const Evaluacion = () => {

  const initialValue = { a: false, b: false, c: false }
  const route = useRouter()
  const { evaluacion, preguntasRespuestas } = useGlobalContext()
  const { getEvaluacion, getPreguntasRespuestas } = useAgregarEvaluaciones()
  const [showModal, setShowModal] = useState(false)
  const [checkedValues, setCheckedValues] = useState(initialValue)
  const [showModalEstudiante, setShowModalEstudiante] = useState(false)
  const handleshowModal = () => {
    setShowModal(!showModal)
  }

  const handleShowModalEstudiante = () => {
    setShowModalEstudiante(!showModalEstudiante)
  }
  useEffect(() => {
    getEvaluacion(`${route.query.id}`)
    if (route.query.id) {
      getPreguntasRespuestas(`${route.query.id}`)
    }
  }, [route.query.id])


  return (
    <div className='p-20'>

      {
        showModal &&
        <AgregarPreguntasRespuestas id={`${route.query.id}`} showModal={showModal} handleshowModal={handleshowModal} />

      }
      {showModalEstudiante &&
        <EvaluarEstudiante preguntasRespuestas={preguntasRespuestas} id={`${route.query.id}`} handleShowModalEstudiante={handleShowModalEstudiante} />
      }
      <h1 className='text-2xl text-slate-500 uppercase mb-10'>{evaluacion.nombre}</h1>
      <div className='flex gap-3'>
        <button onClick={handleshowModal} className='bg-green-500 p-3 rounded-md shadow text-white capitalize font-semibold'>agregar preguntas</button>

        <button onClick={handleShowModalEstudiante} className='bg-indigo-500 p-3 rounded-md shadow text-white capitalize font-semibold'>evaluar estudiante</button>
        <div className='bg-red-400 p-3 rounded-md shadow text-white capitalize font-semibold cursor-pointer'>
          <Link href={`reporte?idExamen=${route.query.id}`}>reportes</Link>
        </div>
      </div>
      <ul className='mt-10'>
        {preguntasRespuestas.map((pr, index) => {
          return (
            <li key={index} className='border-t-2 border-blue-200 pb-3'>
              <p>{index + 1}. {pr.pregunta}</p>
              {
                pr.alternativas &&
                pr.alternativas.map((al, index) => {
                  return (
                    <div key={index} className='flex gap-5'>
                      <p>{al.alternativa} - </p>
                      <p>{al.descripcion}</p>
                    </div>

                  )
                })
              }
              <button className='bg-yellow-500 p-1 rounded-md'>respuesta correcta: {pr.respuesta}</button>
            </li>
          )
        })}

      </ul>
    </div>
  )
}

export default Evaluacion
Evaluacion.Auth = PrivateRouteDocentes