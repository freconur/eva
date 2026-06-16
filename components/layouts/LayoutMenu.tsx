import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../navbar/Navbar'
import { useGlobalContext, useGlobalContextDispatch } from '@/features/context/GlolbalContext'
import { AppAction } from '@/features/actions/appAction'
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
import ModalConfigurarDistrito from '@/modals/ModalConfigurarDistrito'

interface Props {
  children: JSX.Element | JSX.Element[]
}

const LayoutMenu = ({ children }: Props) => {
  const { showSidebar, currentUserData, isSidebarCollapsed } = useGlobalContext()
  const dispatch = useGlobalContextDispatch()
  const { getUserData } = useUsuario()
  const router = useRouter()

  const [isAuditing, setIsAuditing] = useState(false)
  const [auditedUserName, setAuditedUserName] = useState('')

  useEffect(() => {
    getUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData.dni])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audited = sessionStorage.getItem('audited_user')
      if (audited) {
        try {
          const user = JSON.parse(audited)
          setIsAuditing(true)
          setAuditedUserName(`${user.nombres || ''} ${user.apellidos || ''}`)
        } catch (e) {
          console.error(e)
          setIsAuditing(false)
        }
      } else {
        setIsAuditing(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData.dni])

  const handleExitAudit = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('audited_user')
      const realAdmin = sessionStorage.getItem('real_admin_user')
      if (realAdmin) {
        try {
          const adminData = JSON.parse(realAdmin)
          dispatch({
            type: AppAction.CURRENT_USER_DATA,
            payload: adminData
          })
          sessionStorage.removeItem('real_admin_user')
          router.push('/admin/gestion-usuarios')
        } catch (e) {
          console.error(e)
          getUserData()
          router.push('/login')
        }
      } else {
        sessionStorage.removeItem('real_admin_user')
        getUserData()
        router.push('/login')
      }
    }
  }

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

  const needsSecuritySetup = !isAuditing &&
    currentUserData.perfil?.rol !== undefined &&
    router.pathname !== '/login' &&
    (!currentUserData.seguridad?.configurado || currentUserData.debeCambiarContrasena === true);

  if (needsSecuritySetup) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center">
        <ModalConfigurarSeguridad />
      </div>
    )
  }

  const needsDistrictSetup = !isAuditing &&
    currentUserData.perfil?.rol !== undefined &&
    currentUserData.perfil?.rol === 3 &&
    router.pathname !== '/login' &&
    (!currentUserData.distrito || currentUserData.distrito.trim() === '');

  if (needsDistrictSetup) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center">
        <ModalConfigurarDistrito />
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
        {isAuditing && (
          <div className={styles.auditBanner}>
            <div className={styles.auditInfo}>
              <span className={styles.auditBadge}>Modo Auditoría</span>
              <span>Visualizando la plataforma como: <strong>{auditedUserName}</strong> (DNI: {currentUserData.dni} - Rol: {currentUserData.perfil?.nombre})</span>
            </div>
            <button onClick={handleExitAudit} className={styles.exitAuditBtn}>
              Regresar a mi Administrador
            </button>
          </div>
        )}
        {currentUserData.perfil?.rol && router.pathname !== '/login' && (
          <Navbar />
        )}
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>

      {/* Modal obligatorio para directores sin tipo de gestión definido */}
      {!isAuditing &&
        currentUserData.perfil?.rol === 2 &&
        currentUserData.tipoGestion === undefined &&
        router.pathname !== '/login' && (
          <ModalTipoGestion currentUserData={currentUserData} />
      )}
    </div>
  )
}

export default LayoutMenu