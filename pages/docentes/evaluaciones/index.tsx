import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { RiLoader4Line } from 'react-icons/ri'
import primaria from '../../../assets/primaria.png'
import secundaria from '../../../assets/secundaria.png'
import inicial from '../../../assets/inicial.png'

const Evaluaciones = () => {
  const { getEvaluaciones } = useAgregarEvaluaciones()
  const { evaluaciones, currentUserData, loaderPages } = useGlobalContext()

  useEffect(() => {
    getEvaluaciones()
  }, [currentUserData.dni])

  console.log('evaluaciones', evaluaciones)
  return (
    <div className='bg-gradient-to-r to-color-azul-oscuro from-1% from-fondoSegundocolor to-99% h-full p-10'>
      <h1 className='font-martianMono uppercase text-3xl text-white text-center mb-10'>evaluaciones por niveles</h1>
      <div className='grid gap-10 justify-center items-center'>
        <div className='grid grid-cols-3 h-[200px] w-[75%] bg-ggw-1 overflow-hidden rounded-md drop-shadow-2xl'>
          <div className='relative h-full grid justify-center items-center uppercase  p-3 font-semibold'>
            <div className='absolute z-[10] right-[10px] bottom-[-10px] opacity-70'>
              <Image
                alt="logo formativa"
                src={secundaria}
                width={400}
                height={300}
              />
            </div>
            <h3 className='relative z-[30] text-2xl text-white font-bold font-montserrat text-center'>educación secundaria</h3>
          </div>
          <div className='relative grid grid-rows-tablaEstandar bg-tableEstandares4 cursor-pointer hover:opacity-80'>
            <div className='absolute z-[50] top-[-20px] right-[105px]'>
              <p className='font-martianMono font-semibold text-[120px] text-white opacity-50 '>6</p>
            </div>
            <div className="relative z-[40] bg-tableEstandares4 flex justify-center items-center text-2xl p-3 break-all ">
              <p className='break-all text-tableEstandares6 capitalize'>estandar de aprendizaje</p>
            </div>
            <div className='relative z-[40] bg-white text-center opacity-90 grid justify-center items-center rounded-t-md'>
              <p className='font-martianMono uppercase'>nivel 6</p>
            </div>
          </div>
          <div className='grid relative grid-rows-tablaEstandar bg-tableEstandares3 cursor-pointer hover:opacity-80'>
            <div className='absolute z-[50] top-[-20px] right-[105px]'>
              <p className='font-martianMono font-semibold text-[120px] text-white opacity-50 '>7</p>
            </div>
            <div className="bg-tableEstandares3 flex justify-center items-center text-2xl p-3 break-all ">
              <p className='break-all text-white capitalize'>estandar de aprendizaje</p>
            </div>
            <div className='bg-tableEstandares5 opacity-60 text-center grid justify-center items-center rounded-t-md'>
              <p className='font-martianMono uppercase'>nivel 7</p>
            </div>
          </div>

        </div>
        <div className='grid grid-cols-4 h-[200px] bg-gos-1 overflow-hidden rounded-md drop-shadow-2xl'>
          <div className='relative h-full grid justify-center items-center uppercase  p-3 font-semibold'>
            <div className='absolute z-[10] right-[-5px] bottom-[-10px] opacity-80'>
              <Image
                alt="logo formativa"
                src={primaria}
                width={300}
                height={200}
              />
            </div>
            <h3 className='relative z-[30] text-2xl text-white font-bold font-montserrat text-center'>educación primaria</h3>
          </div>
          <div className='grid relative grid-rows-tablaEstandar bg-colorCuarto cursor-pointer hover:opacity-80'>
            <div className='absolute z-[50] top-[-20px] right-[105px]'>
              <p className='font-martianMono font-semibold text-[120px] text-white opacity-50 '>3</p>
            </div>
            <div className="bg-colorCuarto flex justify-center items-center text-2xl p-3 break-all ">
              <p className='break-all text-tableEstandares6 capitalize'>estandar de aprendizaje</p>
            </div>
            <div className='bg-white text-center opacity-90 grid justify-center items-center rounded-t-md'>
              <p className='font-martianMono uppercase'>nivel 3</p>
            </div>
          </div>
          <div className='grid grid-rows-tablaEstandar bg-graduado-blue-1 cursor-pointer hover:opacity-80 relative'>
            <div className='absolute z-[50] top-[-20px] right-[105px]'>
              <p className='font-martianMono font-semibold text-[120px] text-white opacity-50 '>4</p>
            </div>
            <div className="bg-graduado-blue-1 flex justify-center items-center text-2xl p-3 break-all ">
              <p className='break-all text-white capitalize'>estandar de aprendizaje</p>
            </div>
            <div className='bg-tableEstandares5 opacity-60 text-center grid justify-center items-center rounded-t-md'>
              <p className='font-martianMono uppercase'>nivel 4</p>
            </div>
          </div>
          <div className='grid grid-rows-tablaEstandar bg-pastel13 cursor-pointer hover:opacity-80 relative'>
            <div className='absolute z-[50] top-[-20px] right-[105px]'>
              <p className='font-martianMono font-semibold text-[120px] text-white opacity-50 '>5</p>
            </div>
            <div className="bg-pastel13 flex justify-center items-center text-2xl p-3 break-all ">
              <p className='break-all text-tableEstandares6 capitalize'>estandar de aprendizaje</p>
            </div>
            <div className='bg-tableEstandares5 opacity-60 text-center grid justify-center items-center rounded-t-md'>
              <p className='font-martianMono uppercase'>nivel 5</p>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-3 h-[200px]  w-[75%] bg-pastel14 overflow-hidden rounded-md  drop-shadow-2xl'>
          <div className='relative h-full grid justify-center items-center uppercase text-tableEstandares6 p-3 font-semibold'>
            <div className='absolute z-[10] right-[0px] bottom-[-10px] opacity-80'>
              <Image
                alt="logo formativa"
                src={inicial}
                width={300}
                height={200}
              />
            </div>
            <h3 className='relative z-[30] text-2xl text-white font-bold font-montserrat text-center'>educación inicial</h3>
          </div>
          <div className='grid grid-rows-tablaEstandar bg-tere cursor-pointer hover:opacity-80 relative'>
            <div className='absolute z-[50] top-[-20px] right-[105px]'>
              <p className='font-martianMono font-semibold text-[120px] text-white opacity-50 '>1</p>
            </div>
            <div className="bg-tere flex justify-center items-center text-2xl p-3 break-all ">
              <p className='break-all text-white capitalize'>estandar de aprendizaje</p>
            </div>
            <div className='bg-tableEstandares5 opacity-60 text-center grid justify-center items-center rounded-t-md'>
              <p className='font-martianMono uppercase'>nivel 1</p>
            </div>
          </div>
          <div className='grid grid-rows-tablaEstandar bg-iconColor cursor-pointer hover:opacity-80 relative'>
            <div className='absolute z-[50] top-[-20px] right-[105px]'>
              <p className='font-martianMono font-semibold text-[120px] text-white opacity-50 '>2</p>
            </div>
            <div className="bg-iconColor flex justify-center items-center text-2xl p-3 break-all ">
              <p className='break-all text-tableEstandares6 capitalize'>estandar de aprendizaje</p>
            </div>
            <div className='bg-tableEstandares5 opacity-60 text-center grid justify-center items-center rounded-t-md'>
              <p className='font-martianMono uppercase'>nivel 2</p>
            </div>
          </div>
        </div>
      </div>

    </div>

    // <>
    //   {
    //     loaderPages ?
    //       <div className='grid grid-rows-loader'>
    //         <div className='flex justify-center items-center'>
    //           <RiLoader4Line className="animate-spin text-3xl text-colorTercero " />
    //           <span className='text-colorTercero animate-pulse'>...cargando</span>
    //         </div>
    //       </div>

    //       :
    //       <div className='grid justify-center items-center relative mt-3'>
    //         <div className='w-[1024px] bg-white  p-20'>
    //           <h1 className='text-colorSexto font-semibold text-3xl font-mono mb-10 capitalize'>evaluaciones</h1>
    //           <table className='w-full  bg-white  rounded-md shadow-md'>
    //             <thead className='bg-colorSegundo border-b-2 border-blue-300 '>
    //               <tr className='text-white capitalize font-nunito '>
    //                 <th className="uppercase  pl-1 md:pl-2 px-1 text-center">#</th>
    //                 <th className="py-3 md:p-2  text-left">nombre de evaluación</th>
    //               </tr>
    //             </thead>
    //             <tbody className="divide-y divide-gray-100">
    //               {
    //                 evaluaciones.length > 0 ?
    //                   evaluaciones?.map((eva, index) => {
    //                     return (
    //                       <tr key={index} className='h-[60px] hover:bg-blue-100 duration-300 cursor-pointer'>
    //                         <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-center'>
    //                           <Link href={`/docentes/evaluaciones/evaluacion/${eva.id}`}>
    //                             {index + 1}
    //                           </Link>
    //                         </td>
    //                         <td className='uppercase text-slate-500 pl-1 md:pl-2 px-1 text-left'>
    //                           <Link href={`/docentes/evaluaciones/evaluacion/${eva.id}`}>
    //                             {eva.nombre}
    //                           </Link>
    //                         </td>
    //                       </tr>
    //                     )
    //                   })
    //                   :
    //                   null
    //               }
    //             </tbody>
    //           </table>
    //         </div>
    //       </div>

    //   }
    // </>
  )
}

export default Evaluaciones
Evaluaciones.Auth = PrivateRouteDocentes