import React, { useState, useEffect } from 'react'
import Link from 'next/link';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import SidebarRegional from './SidebarRegional';
import styles from './sidebar.module.css'
import { FaUserGraduate, FaUserTie } from 'react-icons/fa';
import { MdAccountCircle, MdAttachMoney } from 'react-icons/md';
import { LuListTodo } from "react-icons/lu";
import { IoIosArrowDown, IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { useGlobalContext } from '@/features/context/GlolbalContext';
import PermissionGate from '@/components/permissions/PermissionGate';
import { PERMISSIONS } from '@/features/utils/permissions';
import { useRouter } from 'next/router';

interface Props {
  showSidebar: boolean
}

const SidebarDirectores = ({ showSidebar }: Props) => {
  const router = useRouter();
  const { showSidebarValue, toggleSidebarCollapsed } = useRolUsers()
  const { currentUserData, isSidebarCollapsed } = useGlobalContext()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isDevUser =
    currentUserData?.dni === '47163626' ||
    currentUserData?.id === '47163626' ||
    (currentUserData as any)?.documento === '47163626' ||
    (typeof currentUserData?.email === 'string' && currentUserData.email.includes('47163626'));

  // Close sidebar on route change (Mobile only logic)
  useEffect(() => {
    const p = router.pathname;

    if (p.includes('/directores/evaluaciones')) {
      setOpenDropdown('estudiantes');
    } else if (p.includes('/directores/evaluaciones-docentes') || p.includes('/directores/agregar-profesores') || p.includes('/directores/cobertura-curricular')) {
      setOpenDropdown('docentes');
    }
  }, [router.pathname]);

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

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

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
            <div className={`${styles.dashboardMenuItem} ${router.pathname === '/mi-cuenta' ? styles.activeLink : ''}`}>
              <MdAccountCircle className={styles.dashboardIcon} />
              <Link className={styles.dashboardLink} href="/mi-cuenta" aria-haspopup="true">
                Mi cuenta
              </Link>
            </div>

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

            <div className={styles.menuContainer}>
              <ul className={styles.menuList}>
                {/* Estudiantes */}
                <li className={styles.menuItem}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('estudiantes');
                  }}>
                    <FaUserGraduate className={styles.icon} />
                    <span className={styles.link}>Estudiantes</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'estudiantes' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'estudiantes' ? styles.show : ''}`}>
                    <li><Link href="/directores/evaluaciones" className={`${styles.submenuLink} ${router.pathname.includes('/directores/evaluaciones') && !router.pathname.includes('docentes') ? styles.activeLink : ''}`}>Seguimiento de aprendizaje</Link></li>
                  </ul>
                </li>

                {/* Docentes */}
                <li className={styles.menuItem}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('docentes');
                  }}>
                    <FaUserTie className={styles.icon} />
                    <span className={styles.link}>Docentes</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'docentes' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'docentes' ? styles.show : ''}`}>
                    <PermissionGate permission={PERMISSIONS.VIEW_MEDIACION_DIDACTICA}>
                      <li>
                        <Link href="/directores/evaluaciones-docentes" className={`${styles.submenuLink} ${router.pathname.includes('/directores/evaluaciones-docentes') ? styles.activeLink : ''}`}>
                          Mediación didáctica
                        </Link>
                      </li>
                    </PermissionGate>

                    <li>
                      <Link href="/directores/agregar-profesores" className={`${styles.submenuLink} ${router.pathname.includes('/directores/agregar-profesores') ? styles.activeLink : ''}`}>
                        Crear usuario
                      </Link>
                    </li>

                    <PermissionGate permission={PERMISSIONS.VIEW_COBERTURA_CURRICULAR}>
                      <li>
                        <Link href="/directores/cobertura-curricular" className={`${styles.submenuLink} ${router.pathname.includes('/directores/cobertura-curricular') ? styles.activeLink : ''}`}>
                          Cobertura curricular
                        </Link>
                      </li>
                    </PermissionGate>

                    <li>
                      <Link href="/directores/reporte" className={`${styles.submenuLink} ${router.pathname.includes('/directores/reporte') ? styles.activeLink : ''}`}>
                        Reporte
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Autorreporte */}
                <PermissionGate permission={PERMISSIONS.VIEW_AUTORREPORTE}>
                  <li className={styles.menuItem}>
                    <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/admin/conocimientos-pedagogicos') && router.query.rol === '2' ? styles.activeLink : ''}`} style={{ margin: 0, padding: "12px 20px" }}>
                      <LuListTodo className={styles.dashboardIcon} />
                      <Link className={styles.dashboardLink} href="/admin/conocimientos-pedagogicos?rol=2" aria-haspopup="true">
                        Autorreporte
                      </Link>
                    </div>
                  </li>
                </PermissionGate>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SidebarDirectores