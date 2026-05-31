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
import ModalTipoGestion from '@/modals/ModalTipoGestion'
import ModalConfigurarSeguridad from '@/modals/ModalConfigurarSeguridad'

interface Props {
  children: JSX.Element | JSX.Element[]
}

const LayoutMenu = ({ children }: Props) => {
  const { showSidebar, currentUserData, isSidebarCollapsed } = useGlobalContext()
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
          {/* <div className={styles.logoContainer}>
            <Image
              alt="logo formativa"
              src={logo}
              width={80}
              height={80}
            />
          </div> */}
          <SidebarEspecialistas showSidebar={showSidebar} />
        </>
      )
    } else if (currentUserData.perfil?.rol === 2) {
      return (
        <>
          {/* <div className={styles.logoContainer}>
            <Image
              alt="logo formativa"
              src={logo}
              width={80}
              height={80}
            />
          </div> */}
          <SidebarDirectores showSidebar={showSidebar} />
        </>
      )
    } else if (currentUserData.perfil?.rol === 3) {
      return (
        <>
          {/* <div className={styles.logoContainer}>
            <Image
              alt="logo formativa"
              src={logo}
              width={80}
              height={80}
            />
          </div> */}
          <SidebarDocentes showSidebar={showSidebar} />
        </>
      )
    } else if (currentUserData.perfil?.rol === 4 || currentUserData.perfil?.rol === 5) {
      return (
        <>
          {/* <div className={styles.logoContainer}>
            <Image
              priority
              alt="logo formativa"
              src={logo}
              width={80}
              height={80}
            />
          </div> */}
          <SidebarAdmin showSidebar={showSidebar} />
        </>
      )
    }
  }

  const needsSecuritySetup = currentUserData.perfil?.rol !== undefined &&
    router.pathname !== '/login' &&
    (!currentUserData.seguridad?.configurado || currentUserData.debeCambiarContrasena === true);

  if (needsSecuritySetup) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center">
        <ModalConfigurarSeguridad />
      </div>
    )
  }

  const hasSidebar = Boolean(currentUserData.perfil?.rol && router.pathname !== '/login');

  return (
    <div className={`${styles.container} ${hasSidebar ? styles.withSidebar : ''} ${isSidebarCollapsed ? styles.collapsedSidebar : ''}`}>
      {currentUserData.perfil?.rol &&
        siderbarSegunPerfil()
      }
      <div className={styles.contentWrapper}>
        {currentUserData.perfil?.rol && router.pathname !== '/login' && (
          <Navbar />
        )}
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>

      {/* Modal obligatorio para directores sin tipo de gestión definido */}
      {currentUserData.perfil?.rol === 2 &&
        currentUserData.tipoGestion === undefined &&
        router.pathname !== '/login' && (
          <ModalTipoGestion currentUserData={currentUserData} />
      )}
    </div>
  )
}

export default LayoutMenu