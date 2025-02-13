import { useGlobalContext } from '@/features/context/GlolbalContext'
import { useRolUsers } from '@/features/hooks/useRolUsers'
import React from 'react'


interface Props {
  showSidebar:boolean
}
const SidebarInfoUser = ({showSidebar}:Props) => {

  const { showSidebarValue } = useRolUsers()
  const { currentUserData } = useGlobalContext()
  return (
    <div className='my-2 border-b-[1px] border-slate-200 '>
      <div className='grid justify-end '>
        <div onClick={() => showSidebarValue(showSidebar)} className='capitalize p-2 w-[30px] h-[30px] bg-red-400 justify-center items-center flex rounded-full text-white l-10 cursor-pointer'>x</div>

      </div>
      <div>
        <p className='capitalize text-center text-slate-600 text-2xl'>{currentUserData.institucion}</p>
      </div>
      {/* <div className='mt-1 w-full flex justify-center items-center'>
          <div className='bg-green-400 w-[100px] h-[100px] rounded-full m-auto flex justify-content items-center'>
            <p className='text-center text-4xl uppercase font-semibold m-auto'>{userData.name ? userData.name[0]: null}</p>
          </div>
      </div> */}
      <div className='mt-1'><p className='capitalize text-center text-slate-500'>{currentUserData.nombres} {currentUserData.apellidos}</p></div>
      <div className='mt-1'><p className='capitalize text-center text-slate-400'>{currentUserData.perfil?.nombre}</p></div>
    </div>
  )
}

export default SidebarInfoUser