import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useRolUsers } from '@/features/hooks/useRolUsers'
import React from 'react'


interface Props {
  showSidebar: boolean
}
const SidebarInfoUser = ({ showSidebar }: Props) => {


  const { currentUserData } = useGlobalContext()

  // console.log('currentUserData', currentUserData)
  return (
    <div className='border-b-[1px] border-slate-200 pb-5 pl-3'>

      {/* <div className='grid justify-end '>

      </div> */}
      <div >
        <p className='text-white text-sm uppercase'>{currentUserData.institucion ? currentUserData.institucion : null}</p>
      </div>
      <div className='mt-1 w-full flex justify-center items-center'>
        {/* <div className='bg-colorSegundo shadow-md w-[50px] h-[50px] rounded-full m-auto flex justify-content items-center'>
          <p className=' text-4xl uppercase font-semibold text-white m-auto'>{currentUserData.nombres ? currentUserData.nombres[0] : null}</p>
        </div> */}
      </div>
      <div className='mt-1'><p className='capitalize   text-white'>{currentUserData.nombres} {currentUserData.apellidos}</p></div>
      <div className='mt-1'><p className='capitalize   text-white'>{currentUserData.perfil?.nombre}</p></div>
    </div>
  )
}

export default SidebarInfoUser