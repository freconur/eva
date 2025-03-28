import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import Image from 'next/image';
import React from 'react'
import { HiOutlineMenu } from 'react-icons/hi';
import logo from '../../assets/formativa-logo.png'
const Navbar = () => {
  const { showSidebarValue } = useRolUsers()
  const { showSidebar } = useGlobalContext()
  return (
    <div className='w-full flex justify-between h-[60px] shadow-md  z-50 relative bg-gradient-to-r to-colorQuinto  from-colorSegundo'>
      <div className='flex justify-between items-center w-full'>
        <div onClick={() => showSidebarValue(showSidebar)} className='  w-[60px] flex justify-center items-center '>
          <HiOutlineMenu className='text-white text-5xl cursor-pointer hover:text-[45px] hover:text-white duration-300 font-semibold hover:rotate-2' />
        </div>
      </div>


    </div>
  )
}

export default Navbar