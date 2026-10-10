import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import { useRouter } from 'next/router';
import SidebarRegional from './SidebarRegional';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useSidebarLabels } from '@/features/context/SidebarLabelsContext';
import CustomSidebarRenderer from './CustomSidebarRenderer';
import { PERMISSIONS } from '@/features/utils/permissions';
import PermissionGate from '../permissions/PermissionGate';
import styles from './sidebar.module.css';
import { MdAccountCircle } from 'react-icons/md';
import { FaUserGraduate, FaUsers } from 'react-icons/fa';
import { LuListTodo } from "react-icons/lu";
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

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const hasSubmenusSeguimiento = customItems.some(
    (item) => (item.role === 'docente' || item.role === 'all') && item.parentId === 'docente_seguimiento'
  );
  const hasSubmenusEstudiantes = customItems.some(
    (item) => (item.role === 'docente' || item.role === 'all') && item.parentId === 'docente_estudiantes'
  );
  const hasSubmenusAutorreporte = customItems.some(
    (item) => (item.role === 'docente' || item.role === 'all') && item.parentId === 'docente_autorreporte'
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

          <div>
            <div className={styles.sectionHeader}>{getLabel('sidebar_seccionPrincipal', 'Principal')}</div>

            <div className={styles.menuContainer}>
              <div className={`${styles.dashboardMenuItem} ${router.pathname === '/mi-cuenta' ? styles.activeLink : ''}`}>
                <MdAccountCircle className={styles.dashboardIcon} />
                <Link className={styles.dashboardLink} href="/mi-cuenta" aria-haspopup="true">
                  {getLabel('docente_miCuenta', 'Mi cuenta')}
                </Link>
                <span className={styles.tooltip}>{getLabel('docente_miCuenta', 'Mi cuenta')}</span>
              </div>

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
                      >
                        <span className="truncate">{getLabel('docente_seguimiento', 'Seguimiento de aprendizajes')}</span>
                      </Link>
                    </li>
                    <CustomSidebarRenderer role="docente" parentId="docente_seguimiento" customItems={customItems} isSubmenu={true} />
                  </ul>
                </div>
              ) : (
                <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/docentes/evaluaciones') ? styles.activeLink : ''}`}>
                  <FaUserGraduate className={styles.dashboardIcon} />
                  <Link className={styles.dashboardLink} href="/docentes/evaluaciones" aria-haspopup="true">
                    {getLabel('docente_seguimiento', 'Seguimiento de aprendizajes')}
                  </Link>
                  <span className={styles.tooltip}>{getLabel('docente_seguimiento', 'Seguimiento de aprendizajes')}</span>
                </div>
              )}

              {/* Mis Estudiantes */}
              {hasSubmenusEstudiantes ? (
                <div className={`${styles.menuItem} ${openDropdown === 'estudiantes' ? styles.itemOpen : ''}`}>
                  <div
                    className={styles.menuHeader}
                    onClick={() => toggleDropdown('estudiantes')}
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
                      >
                        <span className="truncate">{getLabel('docente_estudiantes', 'Mis Estudiantes')}</span>
                      </Link>
                    </li>
                    <CustomSidebarRenderer role="docente" parentId="docente_estudiantes" customItems={customItems} isSubmenu={true} />
                  </ul>
                </div>
              ) : (
                <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/docentes/estudiantes') ? styles.activeLink : ''}`}>
                  <FaUsers className={styles.dashboardIcon} />
                  <Link className={styles.dashboardLink} href="/docentes/estudiantes" aria-haspopup="true">
                    {getLabel('docente_estudiantes', 'Mis Estudiantes')}
                  </Link>
                  <span className={styles.tooltip}>{getLabel('docente_estudiantes', 'Mis Estudiantes')}</span>
                </div>
              )}

              {/* Autorreporte */}
              <PermissionGate permission={PERMISSIONS.VIEW_AUTORREPORTE}>
                {hasSubmenusAutorreporte ? (
                  <div className={`${styles.menuItem} ${openDropdown === 'autorreporte' ? styles.itemOpen : ''}`}>
                    <div
                      className={styles.menuHeader}
                      onClick={() => toggleDropdown('autorreporte')}
                    >
                      <LuListTodo className={styles.icon} />
                      <span className={styles.link}>
                        {getLabel('docente_autorreporte', 'Autorreporte')}
                      </span>
                      <IoIosArrowDown
                        className={`${styles.arrowIcon} ${
                          openDropdown === 'autorreporte' ? styles.arrowRotate : ''
                        }`}
                      />
                    </div>
                    <ul className={`${styles.submenu} ${openDropdown === 'autorreporte' ? styles.show : ''}`}>
                      <li>
                        <Link
                          href="/admin/conocimientos-pedagogicos?rol=3"
                          className={`${styles.submenuLink} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '3' ? styles.activeLink : ''}`}
                        >
                          <span className="truncate">{getLabel('docente_autorreporte', 'Autorreporte')}</span>
                        </Link>
                      </li>
                      <CustomSidebarRenderer role="docente" parentId="docente_autorreporte" customItems={customItems} isSubmenu={true} />
                    </ul>
                  </div>
                ) : (
                  <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '3' ? styles.activeLink : ''}`}>
                    <LuListTodo className={styles.dashboardIcon} />
                    <Link className={styles.dashboardLink} href="/admin/conocimientos-pedagogicos?rol=3" aria-haspopup="true">
                      {getLabel('docente_autorreporte', 'Autorreporte')}
                    </Link>
                    <span className={styles.tooltip}>{getLabel('docente_autorreporte', 'Autorreporte')}</span>
                  </div>
                )}
              </PermissionGate>

              {/* Menús Personalizados para Docentes */}
              <CustomSidebarRenderer role="docente" customItems={customItems} isSubmenu={false} asMenuItem={false} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SidebarDocentes