import { useGlobalContext } from '@/features/context/GlolbalContext'
import { regionTexto } from '@/fuctions/regiones'
import Image from 'next/image'
import React from 'react'
import logo from '../../assets/formativa-logo.png'

const SidebarRegional = () => {
  const { currentUserData } = useGlobalContext()
  return (
    <div className='border-b-[1px] border-slate-200 pb-2 '>
      <h1 className='uppercase text-lg text-center font-dmMono text-slate-600'>planificación curricular</h1>
      <div className='flex justify-center items-center'>
        <Image
          alt="foto de perfil"
          src={logo}
          // src={`https://firebasestorage.googleapis.com/v0/b/attendance-system-d1f40.appspot.com/o/ugel-huancane.png?alt=media&token=21404b68-c541-4d27-b8d5-173729324f9a`}
          // fill
          width={70}
          height={70}
        />
      </div>
      <p className='capitalize text-sm text-center p-2 text-slate-500 text-md '>
      ugel {regionTexto(`${currentUserData.region}`)}
      </p>
    </div>
  )
}

export default SidebarRegional