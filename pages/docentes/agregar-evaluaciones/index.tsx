import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import AgregarPreguntasRespuestas from '@/modals/agregarPreguntasYRespuestas'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'

const AgregarEvaluaciones = () => {
  const initialValues = { evaluacion: "" }

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const [showModal, setShowModal] = useState(false)
  const [nombreEvaluacion, setNombreEvaluacion] = useState<{ evaluacion: string }>(initialValues)
  const { crearEvaluacion } = useAgregarEvaluaciones()
  const handleshowModal = () => {
    setShowModal(!showModal)
  }

  const handleChangeNombreEvalucion = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNombreEvaluacion({
      ...nombreEvaluacion,
      [e.target.name]: e.target.value
    })
  }
  const handleAgregarEvaluacion = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault()
    crearEvaluacion(nombreEvaluacion.evaluacion)
    setNombreEvaluacion(initialValues)
  }
  return (
    <>
      {/* <button onClick={handleshowModal} className='p-3 bg-blue-300'>abrir</button> */}
      {/* {
        showModal &&
        <AgregarPreguntasRespuestas showModal={showModal} handleshowModal={handleshowModal}  />
      } */}
      <div className='grid h-login w-full p-1 place-content-center'>
        <div className='w-[700px]'>
          <h1 className='font-semibold text-center text-2xl uppercase text-slate-600'>crear evaluacion</h1>

          <form onSubmit={handleAgregarEvaluacion}>
            <div className='w-full my-2'>
              <p className='text-slate-400 text-sm uppercase'>nombre de la evaluación</p>
              <input
                onChange={handleChangeNombreEvalucion}
                className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                type="text"
                placeholder="nombre de la evaluacion"
                name='evaluacion'
                value={nombreEvaluacion.evaluacion}
              />
            </div>
            <button
              disabled={nombreEvaluacion.evaluacion.length > 5 ? false : true}
              // onClick={handleshowModal}
              className={`cursor-pointer flex justify-center items-center ${nombreEvaluacion.evaluacion.length > 5 ? 'bg-blue-500 hover:bg-blue-300' : 'bg-gray-300'}    duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase`}>
              guardar
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default AgregarEvaluaciones
AgregarEvaluaciones.Auth = PrivateRouteDocentes