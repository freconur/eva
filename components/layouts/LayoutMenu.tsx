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
import ModalConfigurarPerfilDirector, { isDirectorProfileIncomplete } from '@/modals/ModalConfigurarPerfilDirector'
import ModalConfigurarSeguridad from '@/modals/ModalConfigurarSeguridad'
import ModalConfigurarDistrito from '@/modals/ModalConfigurarDistrito'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/firebase.config'

const getContrastColor = (hexcolor: string): string => {
  if (!hexcolor) return '#ffffff';
  let cleanHex = hexcolor.startsWith('#') ? hexcolor.slice(1) : hexcolor;
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  if (cleanHex.length !== 6) return '#ffffff';
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#0f172a' : '#ffffff';
};

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
    const applyBrandingColors = (data: any) => {
      const root = document.documentElement;
      if (data.colorPrincipal) {
        root.style.setProperty('--color-principal', data.colorPrincipal);
        const contrastColor = getContrastColor(data.colorPrincipal);
        root.style.setProperty('--color-principal-contrast', contrastColor);
        const hoverBg = contrastColor === '#ffffff' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        root.style.setProperty('--color-navbar-hover', hoverBg);
      }
      if (data.colorSecundario) {
        root.style.setProperty('--color-secundario', data.colorSecundario);
        const contrastColor = getContrastColor(data.colorSecundario);
        root.style.setProperty('--color-secundario-contrast', contrastColor);
      }
      if (data.colorTercero) {
        root.style.setProperty('--color-tercero', data.colorTercero);
        const contrastColor = getContrastColor(data.colorTercero);
        root.style.setProperty('--color-tercero-contrast', contrastColor);
      }
      if (data.colorBackground) {
        root.style.setProperty('--color-background', data.colorBackground);
      }
      if (data.colorLoginBackground) {
        root.style.setProperty('--color-login-background', data.colorLoginBackground);
      }
      if (data.colorLoginAccent) {
        root.style.setProperty('--color-login-accent', data.colorLoginAccent);
      }
      if (data.colorSidebarBackground) {
        root.style.setProperty('--color-sidebar-bg', data.colorSidebarBackground);
      }
      if (data.colorSidebarAccent) {
        root.style.setProperty('--color-sidebar-accent', data.colorSidebarAccent);
      }
      if (data.colorMateriaComunicacion) {
        root.style.setProperty('--color-materia-comunicacion', data.colorMateriaComunicacion);
      }
      if (data.colorMateriaMatematica) {
        root.style.setProperty('--color-materia-matematica', data.colorMateriaMatematica);
      }
      if (data.colorMateriaCiencia) {
        root.style.setProperty('--color-materia-ciencia', data.colorMateriaCiencia);
      }
      if (data.colorMateriaDpcc) {
        root.style.setProperty('--color-materia-dpcc', data.colorMateriaDpcc);
      }
      if (data.colorMateriaSociales) {
        root.style.setProperty('--color-materia-sociales', data.colorMateriaSociales);
      }
    };

    // Cargar colores en caché inmediatamente
    if (typeof window !== 'undefined') {
      const cachedBranding = localStorage.getItem('branding_colors');
      if (cachedBranding) {
        try {
          const data = JSON.parse(cachedBranding);
          applyBrandingColors(data);
        } catch (e) {
          console.error("Error al parsear branding cached:", e);
        }
      }
    }

    const brandDocRef = doc(db, 'configuracion', 'branding');
    const unsubscribe = onSnapshot(brandDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        applyBrandingColors(data);
        // Guardar en localStorage para futuras visitas
        if (typeof window !== 'undefined') {
          localStorage.setItem('branding_colors', JSON.stringify(data));
        }
      }
    }, (err) => {
      console.error("Error al escuchar cambios de branding:", err);
    });

    return () => unsubscribe();
  }, []);

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
  const isFullScreenPage = router.pathname === '/admin/pruebas' || router.pathname === '/login';

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
        {currentUserData.perfil?.rol && router.pathname !== '/login' && router.pathname !== '/admin/pruebas' && (
          <Navbar />
        )}
        <main className={`${styles.mainContent} ${isFullScreenPage ? styles.noPadding : ''}`}>
          {children}
        </main>
      </div>

      {/* Modal obligatorio para directores con información incompleta */}
      {!isAuditing &&
        currentUserData.perfil?.rol === 2 &&
        isDirectorProfileIncomplete(currentUserData) &&
        router.pathname !== '/login' && (
          <ModalConfigurarPerfilDirector currentUserData={currentUserData} />
      )}
    </div>
  )
}

export default LayoutMenu