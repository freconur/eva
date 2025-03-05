import Image from 'next/image'
import React from 'react'
import lectura from '../../../../assets/lectura.png'
import resolucion from '../../../../assets/resuelve-problemas.png'
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import Link from 'next/link'
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
              <h2 className='text-3xl  font-bold text-center'>Estándar de aprendizaje</h2>
            </div>
            <Link href="tercerNivel/pruebas?grado=1&categoria=1" className='cursor-pointer bg-azul-claro4 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
            <Link href="tercerNivel/pruebas?grado=1&categoria=2" className='cursor-pointer bg-azul-claro3 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
            <Link href="tercerNivel/pruebas?grado=2&categoria=1" className='cursor-pointer bg-azul-claro2 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
            <Link href="tercerNivel/pruebas?grado=2&categoria=2" className='cursor-pointer bg-azul-claro h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
          </div>

          <div className='grid grid-rows-nivelPrimaria drop-shadow-lg overflow-hidden rounded-md w-[300px]'>
            <div className=' bg-graduado-blue-1 grid items-center justify-center relative'>
              <div className='absolute z-[50] top-[-30px] right-[105px] m-auto'>
                <p className='font-martianMono font-semibold text-[140px] text-white opacity-50 '>4</p>
              </div>
              <h2 className='text-3xl  font-bold text-center text-white'>Estándar de aprendizaje</h2>
            </div>
            <Link href="tercerNivel/pruebas?grado=3&categoria=1" className='cursor-pointer bg-colorTercero h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
            <Link href="tercerNivel/pruebas?grado=3&categoria=2" className='cursor-pointer bg-colorQuinto h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
            <Link href="tercerNivel/pruebas?grado=4&categoria=1" className='cursor-pointer bg-colorSecundario h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
            <Link href="tercerNivel/pruebas?grado=4&categoria=2" className='cursor-pointer bg-colorCuarto h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
          </div>

          <div className='grid grid-rows-nivelPrimaria drop-shadow-lg overflow-hidden rounded-md w-[300px]'>
            <div className=' bg-pastel13 grid items-center justify-center relative'>
              <div className='absolute z-[50] top-[-30px] right-[105px] m-auto'>
                <p className='font-martianMono font-semibold text-[140px] text-white opacity-50 '>5</p>
              </div>
              <h2 className='text-3xl  font-bold text-center text-color-azul-oscuro'>Estándar de aprendizaje</h2>
            </div>
            <Link href="tercerNivel/pruebas?grado=5&categoria=1" className='cursor-pointer bg-pastel2 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
            <Link href="tercerNivel/pruebas?grado=5&categoria=2" className='cursor-pointer bg-pastel5 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
            <Link href="tercerNivel/pruebas?grado=6&categoria=1" className='cursor-pointer bg-beneficios h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
            <Link href="tercerNivel/pruebas?grado=6&categoria=2" className='cursor-pointer bg-pastel2 h-[100px] relative  grid justify-center items-center hover:opacity-90'>
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
            </Link>
          </div>


        </div>

      </div>
    </div>
  )
}

export default TercerNivel
TercerNivel.Auth = PrivateRouteDocentes