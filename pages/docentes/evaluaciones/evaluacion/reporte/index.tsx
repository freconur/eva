import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useReporteDocente } from '@/features/hooks/useReporteDocente'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const Reportes = () => {
  const route = useRouter()
  const { estudiantes, currentUserData } = useGlobalContext()
  const { estudiantesQueDieronExamen } = useReporteDocente()
  useEffect(() => {
    estudiantesQueDieronExamen(`${route.query.idExamen}`, `${currentUserData.dni}`)
  }, [route.query.idExamen, currentUserData.dni])
  console.log('estudiantes', estudiantes)
  console.log('route', route.query.idExamen)
  return (
    <div className='p-10'>
      <h1 className='text-2xl uppercase mb-10 font-semibold '>reporte de evalucion</h1>
      <div>
        <table className='w-full  bg-white  rounded-md shadow-md relative'>
          <thead className='bg-blue-700 border-b-2 border-blue-300 '>
            <tr className='text-white capitalize font-nunito '>
            <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
            <th className="py-3 md:p-2 pl-1 md:pl-2 text-left ">dni</th>
            <th className="py-3 md:p-2  text-left">nombres y apellidos</th>
            <th className="py-3 md:p-2  text-left">rpta. correctas</th>
            <th className="py-3 md:p-2  text-left">rpta. incorrectas</th>
            <th className="py-3 md:p-2  text-left">total de preguntas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {
              estudiantes?.map((dir, index) => {
                return (
                  <tr key={index} className='h-[60px] hover:bg-blue-100 duration-100 cursor-pointer'>
                    <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>{index + 1}</td>
                    <td  className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{dir.dni}</td>
                    <td  className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>{dir.nombresApellidos}</td>
                    <td  className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>{dir.respuestasCorrectas}</td>
                    <td  className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>{Number(dir.totalPreguntas) - Number(dir.respuestasCorrectas)}</td>
                    <td  className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>{dir.totalPreguntas}</td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Reportes
Reportes.Auth = PrivateRouteDocentes