import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../navbar/Navbar'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import SidebarEspecialistas from '../sidebar/SidebarEspecialistas'
import useUsuario from '@/features/hooks/useUsuario'
import SidebarDirectores from '../sidebar/SidebarDirectores'
import SidebarDocentes from '../sidebar/SidebarDocentes'
import SidebarAdmin from '../sidebar/SidebarAdmin'
import Image from 'next/image'
import logo from '@/assets/cl-logo.png'
import styles from './layout.module.css'

interface Props {
  children: JSX.Element | JSX.Element[]
}

const LayoutMenu = ({ children }: Props) => {
  const { showSidebar, currentUserData } = useGlobalContext()
  const { getUserData } = useUsuario()
  const router = useRouter()
  useEffect(() => {
    getUserData()
  }, [currentUserData.dni])

  const siderbarSegunPerfil = () => {
    if (router.pathname === "/login") {
      return (null)
    }
    if (currentUserData.perfil?.rol === 1) {
      return (
        <>
          <div className={styles.logoContainer}>
            <Image
              alt="logo formativa"
              src={logo}
              width={80}
              height={80}
            />
          </div>
          <SidebarEspecialistas showSidebar={showSidebar} />
          {/* <SidebarAdmin showSidebar={showSidebar} /> */}
          <Navbar />
        </>
      )
    } else if (currentUserData.perfil?.rol === 2) {
      return (
        <>
          <div className={styles.logoContainer}>
            <Image
              alt="logo formativa"
              src={logo}
              width={80}
              height={80}
            />
          </div>
          <SidebarDirectores showSidebar={showSidebar} />
          <Navbar />
        </>
      )
    } else if (currentUserData.perfil?.rol === 3) {
      return (
        <>
          <div className={styles.logoContainer}>
            <Image
              alt="logo formativa"
              src={logo}
              width={80}
              height={80}
            />
          </div>
          <SidebarDocentes showSidebar={showSidebar} />
          <Navbar />
        </>
      )
    } else if (currentUserData.perfil?.rol === 4) {
      return (
        <>
          <div className={styles.logoContainer}>
            <Image
              priority
              alt="logo formativa"
              src={logo}
              width={80}
              height={80}
            />
          </div>
          <SidebarAdmin showSidebar={showSidebar} />
          <Navbar />
        </>
      )
    }
  }
  return (
    <div className={styles.container}>
      {currentUserData.perfil?.rol &&
        siderbarSegunPerfil()
        // <div className='grid h-loader place-content-center justify-center items-center m-auto'>cargando .....</div>
      }
      {children}
    </div>
  )
}

export default LayoutMenu