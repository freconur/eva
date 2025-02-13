import React from 'react'
import SidebarInfoUser from './SidebarInfoUser';
import Link from 'next/link';
import useUsuario from '@/features/hooks/useUsuario';

interface Props {
  showSidebar: boolean
}
const SidebarAdmin = ({ showSidebar }: Props) => {
  const { logout } = useUsuario()
  // const { showSidebar } = useGlobalContext()
  return (
    <div className={`z-[2000] grid-rows-gridRows justify-evenly grid fixed duration-300 drop-shadow-xl h-full w-[250px] bg-white ${showSidebar ? "left-[0px]" : "-left-[300px]"}`}>
      <SidebarInfoUser showSidebar={showSidebar} />
      <ul className='capitalize  p-1 font-comfortaa h-full px-2'>
      <li className='w-full p-3 cursor-pointer  rounded-md text-slate-600 hover:text-white hover:bg-green-400 duration-300 items-center justify-center uppercase'>
          <Link href="/admin/registros" className='p-3'>
            registros
          </Link>
        </li>
        <li className='w-full p-3 cursor-pointer  rounded-md text-slate-600 hover:text-white hover:bg-green-400 duration-300 items-center justify-center uppercase'>
          <Link href="/admin/evaluaciones" className='p-3'>
            evaluaciones
          </Link>
        </li>

        <li className='w-full p-3 cursor-pointer  rounded-md text-slate-600 hover:text-white hover:bg-green-400 duration-300 items-center justify-center uppercase'>
          <Link href="/admin/agregar-directores" className='p-3'>
            Agregar directores
          </Link>
        </li>
        <li className='w-full p-3 cursor-pointer  rounded-md text-slate-600 hover:text-white hover:bg-green-400 duration-300 items-center justify-center uppercase'>
          <Link href="/admin/agregar-evaluaciones" className='p-3'>
            crear evaluacion
          </Link>
        </li>
        <li onClick={logout} className="rounded-sm text-slate-600 pl-2 text-sm flex items-center gap-x-4 cursor-pointer   mt-2 capitalize   hover:bg-pastel14 hover:text-white duration-300  whitespace-nowrap my-3 drop-shadow-lg">
          <p className="my-1 w-56 p-2">
            <span className='text-base flex-1 ml-2 text-md'>cerrar sesión</span>
          </p>
        </li>
      </ul>
    </div>
  )
}

export default SidebarAdmin