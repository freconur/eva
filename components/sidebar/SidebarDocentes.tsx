import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link';
import { useRouter } from 'next/router';
import SidebarRegional from './SidebarRegional';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useSidebarLabels } from '@/features/context/SidebarLabelsContext';
import CustomSidebarRenderer from './CustomSidebarRenderer';
import { useSidebarFlyoutPosition } from '@/features/hooks/useSidebarFlyoutPosition';
import styles from './sidebar.module.css';
import { MdAccountCircle } from 'react-icons/md';
import { FaUserGraduate, FaUsers } from 'react-icons/fa';
import { IoIosArrowForward, IoIosArrowBack, IoIosArrowDown } from 'react-icons/io';

interface Props {
  showSidebar: boolean
}

const SidebarDocentes = ({ showSidebar }: Props) => {
  const router = useRouter();
  const { showSidebarValue, toggleSidebarCollapsed } = useRolUsers()
  const { isSidebarCollapsed, currentUserData } = useGlobalContext()
  const { getLabel, customItems } = useSidebarLabels()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  useSidebarFlyoutPosition(sidebarRef, isSidebarCollapsed);

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const hasSubmenusSeguimiento = customItems.some(
    (item) => (item.role === 'docente' || item.role === 'all') && item.parentId === 'docente_seguimiento'
  );
  const hasSubmenusEstudiantes = customItems.some(
    (item) => (item.role === 'docente' || item.role === 'all') && item.parentId === 'docente_estudiantes'
  );

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

      <div
        ref={sidebarRef}
        className={`${styles.sidebar} ${showSidebar ? styles.show : styles.hide} ${isSidebarCollapsed ? styles.collapsed : ''}`}
      >

        <div onClick={() => showSidebarValue(showSidebar)} className={styles.closeButton}>x</div>

        <div className={styles.sidebarContent}>
          <SidebarRegional />

          <div>
            <div className={styles.sectionHeader}>{getLabel('sidebar_seccionPrincipal', 'Principal')}</div>

            <div className={styles.menuContainer}>
              <Link
                href="/mi-cuenta"
                className={`${styles.dashboardMenuItem} ${router.pathname === '/mi-cuenta' ? styles.activeLink : ''}`}
              >
                <MdAccountCircle className={styles.dashboardIcon} />
                <span className={styles.dashboardLink}>
                  {getLabel('docente_miCuenta', 'Mi cuenta')}
                </span>
                <span className={styles.tooltip}>{getLabel('docente_miCuenta', 'Mi cuenta')}</span>
              </Link>

              {/* Seguimiento de aprendizajes */}
              {hasSubmenusSeguimiento ? (
                <div className={`${styles.menuItem} ${openDropdown === 'seguimiento' ? styles.itemOpen : ''}`}>
                  <div
                    className={styles.menuHeader}
                    onClick={() => toggleDropdown('seguimiento')}
                  >
                    <FaUserGraduate className={styles.icon} />
                    <span className={styles.link}>
                      {getLabel('docente_seguimiento', 'Seguimiento de aprendizajes')}
                    </span>
                    <IoIosArrowDown
                      className={`${styles.arrowIcon} ${
                        openDropdown === 'seguimiento' ? styles.arrowRotate : ''
                      }`}
                    />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'seguimiento' ? styles.show : ''}`}>
                    <li>
                      <Link
                        href="/docentes/evaluaciones"
                        className={`${styles.submenuLink} ${router.pathname.includes('/docentes/evaluaciones') ? styles.activeLink : ''}`}
                        title={getLabel('docente_seguimiento', 'Seguimiento de aprendizajes')}
                      >
                        <span className="truncate">{getLabel('docente_seguimiento', 'Seguimiento de aprendizajes')}</span>
                      </Link>
                    </li>
                    <CustomSidebarRenderer role="docente" parentId="docente_seguimiento" customItems={customItems} isSubmenu={true} />
                  </ul>
                </div>
              ) : (
                <Link
                  href="/docentes/evaluaciones"
                  className={`${styles.dashboardMenuItem} ${router.pathname.includes('/docentes/evaluaciones') ? styles.activeLink : ''}`}
                  title={getLabel('docente_seguimiento', 'Seguimiento de aprendizajes')}
                >
                  <FaUserGraduate className={styles.dashboardIcon} />
                  <span className={styles.dashboardLink}>
                    {getLabel('docente_seguimiento', 'Seguimiento de aprendizajes')}
                  </span>
                  <span className={styles.tooltip}>{getLabel('docente_seguimiento', 'Seguimiento de aprendizajes')}</span>
                </Link>
              )}

              {/* Mis Estudiantes */}
              {hasSubmenusEstudiantes ? (
                <div className={`${styles.menuItem} ${openDropdown === 'estudiantes' ? styles.itemOpen : ''}`}>
                  <div
                    className={styles.menuHeader}
                    onClick={() => toggleDropdown('estudiantes')}
                    title={getLabel('docente_estudiantes', 'Mis Estudiantes')}
                  >
                    <FaUsers className={styles.icon} />
                    <span className={styles.link}>
                      {getLabel('docente_estudiantes', 'Mis Estudiantes')}
                    </span>
                    <IoIosArrowDown
                      className={`${styles.arrowIcon} ${
                        openDropdown === 'estudiantes' ? styles.arrowRotate : ''
                      }`}
                    />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'estudiantes' ? styles.show : ''}`}>
                    <li>
                      <Link
                        href="/docentes/estudiantes"
                        className={`${styles.submenuLink} ${router.pathname.includes('/docentes/estudiantes') ? styles.activeLink : ''}`}
                        title={getLabel('docente_estudiantes', 'Mis Estudiantes')}
                      >
                        <span className="truncate">{getLabel('docente_estudiantes', 'Mis Estudiantes')}</span>
                      </Link>
                    </li>
                    <CustomSidebarRenderer role="docente" parentId="docente_estudiantes" customItems={customItems} isSubmenu={true} />
                  </ul>
                </div>
              ) : (
                <Link
                  href="/docentes/estudiantes"
                  className={`${styles.dashboardMenuItem} ${router.pathname.includes('/docentes/estudiantes') ? styles.activeLink : ''}`}
                  title={getLabel('docente_estudiantes', 'Mis Estudiantes')}
                >
                  <FaUsers className={styles.dashboardIcon} />
                  <span className={styles.dashboardLink}>
                    {getLabel('docente_estudiantes', 'Mis Estudiantes')}
                  </span>
                  <span className={styles.tooltip}>{getLabel('docente_estudiantes', 'Mis Estudiantes')}</span>
                </Link>
              )}

              {/* Menús Personalizados para Docentes */}
              <CustomSidebarRenderer role="docente" customItems={customItems} isSubmenu={false} asMenuItem={false} />
            </div>
          </div>
        </div>

        {/* Toggle Collapse Button for Desktop (Firebase Style - Bottom Circular) */}
        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={styles.collapseToggleBtn}
            onClick={() => toggleSidebarCollapsed(isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expandir" : "Contraer"}
            aria-label={isSidebarCollapsed ? "Expandir" : "Contraer"}
          >
            {isSidebarCollapsed ? <IoIosArrowForward /> : <IoIosArrowBack />}
          </button>
        </div>
      </div>
    </>
  )
}

export default SidebarDocentes