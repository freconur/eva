import PrivateRouteAdmin from '@/components/layouts/PrivateRoutesAdmin'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { Alternativas } from '@/features/types/types'
import AgregarPreguntasRespuestas from '@/modals/agregarPreguntasYRespuestas'
import EvaluarEstudiante from '@/modals/evaluarEstudiante'
import UpdatePreguntaRespuesta from '@/modals/updatePreguntaRespuesta'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { MdEditSquare } from 'react-icons/md'
import { RiLoader4Line } from 'react-icons/ri'

const Evaluacion = () => {
  const route = useRouter()
  const { evaluacion, preguntasRespuestas, currentUserData, loaderPages } = useGlobalContext()
  const { getEvaluacion, getPreguntasRespuestas } = useAgregarEvaluaciones()
  const [showModal, setShowModal] = useState(false)
  const [showModalEstudiante, setShowModalEstudiante] = useState(false)
  const [pregunta, setPregunta] = useState({})
  const [showModalUpdatePReguntaRespuesta, setShowModalUpdatePReguntaRespuesta] = useState(false)

  const handleshowModal = () => {
    setShowModal(!showModal)
  }

  const handleShowModalUpdatePreguntaRespuesta = () => {
    setShowModalUpdatePReguntaRespuesta(!showModalUpdatePReguntaRespuesta)
  }

  const handleSelectPregunta = (index: number) => {
    setPregunta(preguntasRespuestas[index])
  }
  useEffect(() => {
    getEvaluacion(`${route.query.id}`)
    if (route.query.id) {
      getPreguntasRespuestas(`${route.query.id}`)
    }
  }, [route.query.id])
  console.log('preguntasRespuestas', preguntasRespuestas)
  return (


    <>
      {
        showModalUpdatePReguntaRespuesta &&
        <UpdatePreguntaRespuesta id={`${route.query.id}`} pregunta={pregunta} handleShowModalUpdatePreguntaRespuesta={handleShowModalUpdatePreguntaRespuesta} />
      }
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
              <h1 className='text-2xl text-colorSexto font-semibold uppercase mb-10'>{evaluacion.nombre}</h1>
              <div className='flex gap-3 justify-end'>
                {/* <button onClick={handleshowModal} className='bg-green-500 p-3 rounded-md shadow text-white capitalize font-semibold'>agregar preguntas</button> */}
                {
                  showModal &&
                  <AgregarPreguntasRespuestas id={`${route.query.id}`} showModal={showModal} handleshowModal={handleshowModal} />
                }
                <button onClick={handleshowModal} className='bg-green-500 p-3 rounded-md shadow text-white capitalize font-semibold'>agregar preguntas</button>
                <Link href={`reporte?id=${currentUserData.dni}&idEvaluacion=${route.query.id}`} className='bg-colorTercero p-3 rounded-md duration-300 hover:bg-colorCuarto hover:text-colorSegundo text-white shadow-md capitalize font-semibold'>repote de evaluación</Link>
              </div>
              <h2 className='text-2xl text-colorSexto capitalize mb-2 mt-5' >preguntas y respuestas</h2>
              <ul className='mt-1'>
                {preguntasRespuestas.map((pr, index) => {
                  return (
                    <li key={index} className='border-t-2 border-blue-200 pb-3 pt-3'>
                      <div className='flex gap-3 mb-3'>
                        <span className='text-slate-600 font-semibold'>{index + 1}.</span><p className='text-slate-500 text-lg'> {pr.pregunta}</p>

                      </div>
                      <div className='flex gap-3 mb-3'>
                        <span className='text-slate-600 font-semibold'>habilidad:</span><p className='text-slate-500 text-lg'> {pr.preguntaDocente}</p>
                        <MdEditSquare onClick={() => { handleSelectPregunta(index); handleShowModalUpdatePreguntaRespuesta() }} className='text-xl text-yellow-500 cursor-pointer' />
                      </div>
                      {
                        pr.alternativas &&
                        pr.alternativas.map((al, index) => {
                          return (
                            <div key={index} className='flex gap-5 pl-5 justify-start items-center mb-2'>
                              <p className='uppercase text-sm text-colorSegundo'>{al.alternativa} - </p>
                              <p className='text-colorPrincipal'>{al.descripcion}</p>
                            </div>
                          )
                        })
                      }
                      <div className='text-green-500 border border-green-500 p-3 rounded-md w-[120px] mt-4'>respuesta: {pr.respuesta}</div>
                    </li>
                  )
                })}

              </ul>
            </div>
          </div>

      }
    </>
    // <div className='p-20'>

    //   {
    //     showModal &&
    //     <AgregarPreguntasRespuestas id={`${route.query.id}`} showModal={showModal} handleshowModal={handleshowModal} />
    //   }
    //   {showModalEstudiante &&
    //     <EvaluarEstudiante preguntasRespuestas={preguntasRespuestas} id={`${route.query.id}`} handleShowModalEstudiante={handleShowModalEstudiante} />
    //   }
    //   <h1 className='text-2xl text-slate-500 uppercase mb-10'>{evaluacion.nombre}</h1>
    //   <div className='flex gap-3'>
    //     <button onClick={handleshowModal} className='bg-green-500 p-3 rounded-md shadow text-white capitalize font-semibold'>agregar preguntas</button>

    //     <button onClick={handleShowModalEstudiante} className='bg-indigo-500 p-3 rounded-md shadow text-white capitalize font-semibold'>evaluar estudiante</button>
    //   </div>
    //   <ul className='mt-10'>
    //     {preguntasRespuestas.map((pr, index) => {
    //       return (
    //         <li key={index} className='border-t-2 border-blue-200 pb-3'>
    //           <p>{index + 1}. {pr.pregunta}</p>
    //           {
    //             pr.alternativas &&
    //             pr.alternativas.map((al, index) => {
    //               return (
    //                 <div key={index} className='flex gap-5'>
    //                   <p>{al.alternativa} - </p>
    //                   <p>{al.descripcion}</p>
    //                 </div>

    //               )
    //             })
    //           }
    //           <button className='bg-yellow-500 p-1 rounded-md'>respuesta correcta: {pr.respuesta}</button>
    //         </li>
    //       )
    //     })}

    //   </ul>
    // </div>
  )
}

export default Evaluacion
Evaluacion.Auth = PrivateRouteAdmin