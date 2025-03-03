import Image from 'next/image'
import React from 'react'
import lectura from '../../../../assets/lectura.png'
import resolucion from '../../../../assets/resuelve-problemas.png'
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
const TercerNivel = () => {
  return (
    <div className='bg-gradient-to-r  h-full p-10'>
      <div className='w-[960px] grid m-auto'>
        <h1 className='text-3xl font-bold font-martianMono uppercase text-white text-center mb-10'>educación primaria</h1>
        <div className='grid grid-cols-3'>
          <div className='grid grid-rows-nivelPrimaria drop-shadow-lg overflow-hidden rounded-md w-[300px]'>
            <div className=' bg-colorCuarto grid items-center justify-center relative'>
              <div className='absolute z-[50] top-[-30px] right-[105px] m-auto'>
                <p className='font-martianMono font-semibold text-[140px] text-white opacity-50 '>3</p>
              </div>
              <h2 className='text-3xl capitalize font-bold text-center'>estándar de aprendizaje</h2>
            </div>
            <div className='cursor-pointer bg-tablaestandares1 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl text-center capitalize font-montserrat font-bold text-white'>1er grado: lee</p>
            </div>
            <div className='cursor-pointer bg-colorQuinto h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl capitalize text-center font-montserrat font-bold text-white'>1er grado: resuelve problemas</p>
            </div>
            <div className='cursor-pointer bg-colorTercero h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl capitalize font-montserrat font-bold text-white'>2do grado: lee</p>
            </div>
            <div className='cursor-pointer bg-colorSegundo h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl capitalize text-center font-montserrat font-bold text-white'>2do grado: resuelve problemas</p>
            </div>
          </div>

          <div className='grid grid-rows-nivelPrimaria drop-shadow-lg overflow-hidden rounded-md w-[300px]'>
            <div className=' bg-gy-1 grid items-center justify-center relative'>
              <div className='absolute z-[50] top-[-30px] right-[105px] m-auto'>
                <p className='font-martianMono font-semibold text-[140px] text-white opacity-50 '>4</p>
              </div>
              <h2 className='text-3xl capitalize font-bold text-center text-white'>estándar de aprendizaje</h2>
            </div>
            <div className='cursor-pointer bg-gy-2 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl text-center capitalize font-montserrat font-bold text-white'>3er grado: lee</p>
            </div>
            <div className='cursor-pointer bg-gy-3 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl capitalize text-center font-montserrat font-bold text-white'>3er grado: resuelve problemas</p>
            </div>
            <div className='cursor-pointer bg-sidebarHover h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl capitalize font-montserrat font-bold text-white'>4to grado: lee</p>
            </div>
            <div className='cursor-pointer bg-pastel7 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl capitalize text-center font-montserrat font-bold text-white'>4to grado: resuelve problemas</p>
            </div>
          </div>

          <div className='grid grid-rows-nivelPrimaria drop-shadow-lg overflow-hidden rounded-md w-[300px]'>
            <div className=' bg-pastel18 grid items-center justify-center relative'>
              <div className='absolute z-[50] top-[-30px] right-[105px] m-auto'>
                <p className='font-martianMono font-semibold text-[140px] text-white opacity-50 '>5</p>
              </div>
              <h2 className='text-3xl capitalize font-bold text-center text-white'>estándar de aprendizaje</h2>
            </div>
            <div className='cursor-pointer bg-pastel11 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl text-center capitalize font-montserrat font-bold text-white'>5to grado: lee</p>
            </div>
            <div className='cursor-pointer bg-pastel12 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl capitalize text-center font-montserrat font-bold text-white'>5to grado: resuelve problemas</p>
            </div>
            <div className='cursor-pointer bg-cardStatisticsIcon h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={lectura}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl capitalize font-montserrat font-bold text-white'>6to grado: lee</p>
            </div>
            <div className='cursor-pointer bg-headerTable h-[100px] relative  grid justify-center items-center hover:opacity-90'>
              <div className='absolute top-0 bottom-0 left-0 right-0 bg-slate-700 opacity-20 z-[30]'></div>
              <div className='absolute top-[24px] overflow-hidden right-[100px] z-[20]'>
                <Image
                  alt="logo formativa"
                  src={resolucion}
                  width={100}
                  height={100}
                />
              </div>
              <p className='relative z-[40] text-2xl capitalize text-center font-montserrat font-bold text-white'>6to grado: resuelve problemas</p>
            </div>
          </div>


        </div>

      </div>
    </div>
  )
}

export default TercerNivel
TercerNivel.Auth = PrivateRouteDocentes