import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes'
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import { CreaEvaluacion } from '@/features/types/types'
import { especialidad } from '@/fuctions/categorias'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiLoader4Line } from 'react-icons/ri'

const AgregarEvaluacionesDirector = () => {
  const initialValues = { evaluacion: "" }
  const initialValuesForData = { grado: 0, categoria: "", nombreEvaluacion: "" }
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const [showModal, setShowModal] = useState(false)
  const [selectValues, setSelectValues] = useState(initialValuesForData)
  // 
  const { grados, loaderPages } = useGlobalContext()
  const [nombreEvaluacion, setNombreEvaluacion] = useState<{ evaluacion: string }>(initialValues)
  const { crearEvaluacion, getGrades } = useAgregarEvaluaciones()
  const handleshowModal = () => {
    setShowModal(!showModal)
  }
  const handleChangeValues = (e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>) => {
    setSelectValues({
      ...selectValues,
      [e.target.name]: e.target.value
    })
  }
  const handleChangeNombreEvalucion = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNombreEvaluacion({
      ...nombreEvaluacion,
      [e.target.name]: e.target.value
    })
  }
  const handleAgregarEvaluacion = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault()
    crearEvaluacion(selectValues)
    setSelectValues(initialValuesForData)
    // setNombreEvaluacion(initialValues)
  }
  useEffect(() => {
    getGrades()
  }, [])

  return (
    <>
      <div className='grid h-login w-full p-1 place-content-center bg-gradient-to-t from-hoverTableSale  to-hoverTableSale'>
        {
          loaderPages ?
            <div className='grid w-[600px] h-[600px] '>
              <div className='flex justify-center items-center'>
                <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
                <span className='text-colorTercero animate-pulse'>...creado usuario director</span>
              </div>
            </div>
            :


            <div className='w-[700px] bg-white h-full p-10 grid shadow-2xl rounded-lg'>
              <h1 className='font-semibold text-center text-2xl uppercase text-slate-600'>crear evaluacion</h1>

              <form className='grid gap-2' onSubmit={handleAgregarEvaluacion}>
                <div className='w-full my-2'>
                  {/* <p className='text-slate-400 text-sm uppercase'>nombre de la evaluación</p> */}
                  <input
                    onChange={handleChangeValues}
                    className='p-3 outline-none rounded-md shadow-md w-full uppercase text-slate-400'
                    type="text"
                    placeholder="nombre de la evaluacion"
                    name='nombreEvaluacion'
                    value={selectValues.nombreEvaluacion}
                  />
                </div>
                <div className='w-full my-2'>
                  {/* <p className='text-slate-400 text-sm uppercase'>grado</p> */}
                  <select name="grado" onChange={handleChangeValues} className='w-full p-3 drop-shadow-lg text-slate-500'>
                    <option>--GRADOS--</option>
                    {
                      grados?.map((gr, index) => {
                        return (
                          <option value={gr.grado} key={index}>{gr.nombre}</option>
                        )
                      })
                    }

                  </select>
                </div>
                <div className='w-full my-2'>
                  {/* <p className='text-slate-400 text-sm uppercase'>grado</p> */}
                  <select name="categoria" onChange={handleChangeValues} className='w-full p-3 drop-shadow-lg text-slate-500'>
                    <option>--CATEGORIA--</option>
                    {
                      especialidad?.map((esp, index) => {
                        return (
                          <option key={index} value={esp.id}>{esp.categoria}</option>
                        )
                      })
                    }

                  </select>
                </div>
                <button
                  disabled={
                    `${selectValues?.grado}`.length === 1 && selectValues?.categoria?.length === 1 && selectValues.nombreEvaluacion?.length > 3 ? false : true
                  }
                  // onClick={handleshowModal}
                  className={`cursor-pointer flex justify-center items-center ${`${selectValues.grado}`.length === 1 && selectValues?.categoria?.length === 1 && selectValues.nombreEvaluacion?.length > 3 ? 'bg-blue-500 hover:bg-blue-300' : 'bg-gray-300'}    duration-300 p-3 rounded-md w-full text-white hover:text-slate-600 uppercase`}>
                  guardar
                </button>
              </form>
            </div>
        }
      </div>
    </>
  )
}

export default AgregarEvaluacionesDirector
AgregarEvaluacionesDirector.Auth = PrivateRouteDirectores