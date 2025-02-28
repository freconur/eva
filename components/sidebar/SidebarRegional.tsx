import { useGlobalContext } from '@/features/context/GlolbalContext'
import { regionTexto } from '@/fuctions/regiones'
import Image from 'next/image'
import React from 'react'

const SidebarRegional = () => {
  const { currentUserData } = useGlobalContext()
  return (
    <div className='border-b-[1px] border-slate-200 pb-5 mb-5 '>
      <h1 className='uppercase text-lg text-center font-dmMono text-slate-600'>dirección regional de educación puno</h1>
      <div className='flex justify-center items-center'>
        <Image
          alt="foto de perfil"
          src={`https://firebasestorage.googleapis.com/v0/b/attendance-system-d1f40.appspot.com/o/ugel-huancane.png?alt=media&token=21404b68-c541-4d27-b8d5-173729324f9a`}
          // fill
          width={50}
          height={50}
        />
      </div>
      <p className='capitalize text-sm text-center p-2 text-slate-500 text-md '>
      unidad de gestión educativa {regionTexto(`${currentUserData.region}`)}
      </p>
    </div>
  )
}

export default SidebarRegional