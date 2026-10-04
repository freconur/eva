import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import SidebarRegional from './SidebarRegional';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { PERMISSIONS } from '@/features/utils/permissions';
import PermissionGate from '../permissions/PermissionGate';
import styles from './sidebar.module.css';
import { MdAccountCircle, MdAttachMoney } from 'react-icons/md';
import { FaUserGraduate, FaUsers } from 'react-icons/fa';
import { LuListTodo } from "react-icons/lu";
import { IoIosArrowForward, IoIosArrowBack } from 'react-icons/io';
import { useRouter } from 'next/router';

interface Props {
  showSidebar: boolean
}

const SidebarDocentes = ({ showSidebar }: Props) => {
  const router = useRouter();
  const { showSidebarValue, toggleSidebarCollapsed } = useRolUsers()
  const { isSidebarCollapsed, currentUserData } = useGlobalContext()

  const isDevUser =
    currentUserData?.dni === '47163626' ||
    currentUserData?.id === '47163626' ||
    (currentUserData as any)?.documento === '47163626' ||
    (typeof currentUserData?.email === 'string' && currentUserData.email.includes('47163626'));

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

              <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/docentes/estudiantes') ? styles.activeLink : ''}`}>
                <FaUsers className={styles.dashboardIcon} />
                <Link className={styles.dashboardLink} href="/docentes/estudiantes" aria-haspopup="true">
                  Mis Estudiantes
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

              {/* Matriz de Costos (temporalmente oculto)
              {isDevUser && (
                <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/admin/matriz-costos') ? styles.activeLink : ''}`}>
                  <MdAttachMoney className={styles.dashboardIcon} />
                  <Link className={styles.dashboardLink} href="/admin/matriz-costos" aria-haspopup="true">
                    Matriz de Costos
                  </Link>
                </div>
              )}
              */}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SidebarDocentes