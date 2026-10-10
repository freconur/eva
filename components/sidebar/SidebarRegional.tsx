import { useGlobalContext } from '@/features/context/GlolbalContext'
import { regionTexto } from '@/fuctions/regiones'
import Image from 'next/image'
import React from 'react'
import logo from '@/assets/cl-logo.png'
import styles from './layout.module.css'
import { useSidebarLabels } from '@/features/context/SidebarLabelsContext'

const SidebarRegional = () => {
  const { currentUserData, isSidebarCollapsed } = useGlobalContext()
  const { getLabel } = useSidebarLabels()

  return (
    <div className='relative z-[10] border-b border-[rgba(255,255,255,0.08)] pb-2.5 flex flex-col items-center justify-center w-full'>
      {!isSidebarCollapsed && (
        <h1 className='uppercase text-lg text-center font-dmMono text-white flex-shrink-0 animate-fade-in'>
          {getLabel('sidebar_tituloSistema', 'Competence-Lab')}
        </h1>
      )}
      <div className={`${styles.logoContainer} ${isSidebarCollapsed ? styles.logoContainerCollapsed : ''}`}>
        <Image
          alt="Logo Competence-Lab"
          src={logo}
          width={isSidebarCollapsed ? 44 : 68}
          height={isSidebarCollapsed ? 44 : 68}
          priority
        />
      </div>
      {!isSidebarCollapsed && (
        <p className='capitalize text-sm text-center p-2 text-white text-md animate-fade-in'>
          {getLabel('sidebar_subtituloPrefix', 'ugel')} {regionTexto(`${currentUserData.region}`)}
        </p>
      )}
    </div>
  )
}

export default SidebarRegional