import React, { useEffect } from 'react'
import SidebarInfoUser from './SidebarInfoUser';
import Link from 'next/link';
import useUsuario from '@/features/hooks/useUsuario';
import SidebarRegional from './SidebarRegional';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { PERMISSIONS } from '@/features/utils/permissions';
import PermissionGate from '../permissions/PermissionGate';
import styles from './sidebar.module.css';
import { MdAccountCircle } from 'react-icons/md';
import { FaUserGraduate } from 'react-icons/fa';
import { LuListTodo } from "react-icons/lu";
import { IoIosArrowForward, IoIosArrowBack } from 'react-icons/io';
import { FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface Props {
  showSidebar: boolean
}

const SidebarDocentes = ({ showSidebar }: Props) => {
  const router = useRouter();
  const { logout } = useUsuario()
  const { showSidebarValue, toggleSidebarCollapsed } = useRolUsers()
  const { isSidebarCollapsed } = useGlobalContext()

  // Close sidebar on route change (Mobile only logic)
  useEffect(() => {
    const handleRouteChange = () => {
      if (showSidebar) {
        showSidebarValue(showSidebar);
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [showSidebar, router.events, showSidebarValue]);

  const redirectLogin = () => {
    router.push('/login');
  }

  return (
    <>
      <div
        className={`${styles.backdrop} ${showSidebar ? styles.show : styles.hide}`}
        onClick={() => showSidebarValue(showSidebar)}
      />

      <div className={`${styles.sidebar} ${showSidebar ? styles.show : styles.hide} ${isSidebarCollapsed ? styles.collapsed : ''}`}>

        {/* Toggle Collapse Button for Desktop */}
        <div
          className={styles.collapseToggleBtn}
          onClick={() => toggleSidebarCollapsed(isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Expandir" : "Contraer"}
        >
          {isSidebarCollapsed ? <IoIosArrowForward /> : <IoIosArrowBack />}
        </div>

        <div onClick={() => showSidebarValue(showSidebar)} className={styles.closeButton}>x</div>

        <div className={styles.sidebarContent}>
          <SidebarRegional />
          <SidebarInfoUser showSidebar={showSidebar} />

          <div onClick={() => isSidebarCollapsed && toggleSidebarCollapsed(isSidebarCollapsed)}>
            <div className={styles.menuContainer}>
              <div className={`${styles.dashboardMenuItem} ${router.pathname === '/mi-cuenta' ? styles.activeLink : ''}`}>
                <MdAccountCircle className={styles.dashboardIcon} />
                <Link className={styles.dashboardLink} href="/mi-cuenta" aria-haspopup="true">
                  Mi cuenta
                </Link>
              </div>

              <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/docentes/evaluaciones') ? styles.activeLink : ''}`}>
                <FaUserGraduate className={styles.dashboardIcon} />
                <Link className={styles.dashboardLink} href="/docentes/evaluaciones" aria-haspopup="true">
                  Seguimiento de aprendizajes
                </Link>
              </div>

              <PermissionGate permission={PERMISSIONS.VIEW_AUTORREPORTE}>
                <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '3' ? styles.activeLink : ''}`}>
                  <LuListTodo className={styles.dashboardIcon} />
                  <Link className={styles.dashboardLink} href="/admin/conocimientos-pedagogicos?rol=3" aria-haspopup="true">
                    Autorreporte
                  </Link>
                </div>
              </PermissionGate>
            </div>
          </div>
        </div>

        <div onClick={() => { logout(); redirectLogin(); }} className={styles.logoutButton}>
          <FiLogOut className={styles.logoutIcon} />
          <p>cerrar sesión</p>
        </div>
      </div>
    </>
  )
}

export default SidebarDocentes