import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useRolUsers } from '@/features/hooks/useRolUsers'
import React from 'react'


interface Props {
  showSidebar: boolean
}
const SidebarInfoUser = ({ showSidebar }: Props) => {


  const { currentUserData, isSidebarCollapsed } = useGlobalContext()

  if (isSidebarCollapsed) return null;

  return (
    <div className='border-b border-white/20 pb-4 mb-2 px-5 mt-2'>
      {currentUserData.institucion && (
        <div className='mb-2'>
          <p className='text-[#e2e8f0] text-[10px] uppercase font-bold tracking-[0.1em] opacity-80'>{currentUserData.institucion}</p>
        </div>
      )}

      <div className='flex flex-col gap-1'>
        <p className='text-sm font-semibold text-white uppercase leading-snug tracking-wide'>
          {currentUserData.nombres} {currentUserData.apellidos}
        </p>
        <p className='text-[13px] text-white/90 font-medium capitalize'>
          {currentUserData.perfil?.nombre}
        </p>
        {currentUserData.dni && (
          <p className='text-[11px] text-white/60 font-mono tracking-widest mt-0.5'>
            DNI: {currentUserData.dni}
          </p>
        )}
      </div>
    </div>
  )
}

export default SidebarInfoUser