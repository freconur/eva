import React, { useState, useEffect } from 'react'
import SidebarInfoUser from './SidebarInfoUser';
import Link from 'next/link';
import useUsuario from '@/features/hooks/useUsuario';
import SidebarRegional from './SidebarRegional';
import { useRolUsers } from '@/features/hooks/useRolUsers';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import styles from './sidebar.module.css'
import { MdAccountBalance, MdAccountCircle } from 'react-icons/md';
import { FaUserGraduate, FaUserTie } from 'react-icons/fa';
import { LuListTodo } from "react-icons/lu";
import { IoIosArrowDown, IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface Props {
  showSidebar: boolean
}

const SidebarEspecialistas = ({ showSidebar }: Props) => {
  const router = useRouter();
  const { logout } = useUsuario()
  const { showSidebarValue, toggleSidebarCollapsed } = useRolUsers()
  const { currentUserData, isSidebarCollapsed } = useGlobalContext()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Close sidebar on route change (Mobile only logic)
  // Auto-open accordion strictly on page load or navigation
  useEffect(() => {
    const p = router.pathname;

    if (p.includes('/especialistas/evaluaciones-director') || p.includes('/especialistas/cobertura-curricular') || p.includes('/especialistas/agregar-directores')) {
      setOpenDropdown('directivos');
    } else if (p.includes('/especialistas/evaluaciones-docentes') || p.includes('/especialistas/cobertura-curricular-master')) {
      setOpenDropdown('docentes');
    } else if (p.includes('/admin/docentes/usuarios')) {
      setOpenDropdown('docentes-usuarios');
    } else if (p.includes('/especialistas/evaluaciones')) {
      setOpenDropdown('estudiantes');
    }
  }, [router.pathname]);

  useEffect(() => {
    const handleRouteChange = () => {
      // If sidebar is visible (showSidebar is true), we set it to false
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

  const redirectLogin = () => {
    router.push('/login');
  }

  return (
    <>
      {/* Mobile Backdrop */}
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

          {/* Wrapper to detect clicks when collapsed to auto-expand */}
          <div onClick={() => isSidebarCollapsed && toggleSidebarCollapsed(isSidebarCollapsed)}>
            <div className={`${styles.dashboardMenuItem} ${router.pathname === '/mi-cuenta' ? styles.activeLink : ''}`}>
              <MdAccountCircle className={styles.dashboardIcon} />
              <Link className={styles.dashboardLink} href="/mi-cuenta" aria-haspopup="true">
                Mi cuenta
              </Link>
            </div>

            <div className={styles.menuContainer}>
              <ul className={styles.menuList}>
                {/* Directivos */}
                <li className={styles.menuItem}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('directivos');
                  }}>
                    <MdAccountBalance className={styles.icon} />
                    <span className={styles.link}>Directivos</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'directivos' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'directivos' ? styles.show : ''}`}>
                    {!currentUserData.nivelDeInstitucion?.includes(2) && (
                      <>
                        <li><Link href="/especialistas/evaluaciones-director" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/evaluaciones-director') ? styles.activeLink : ''}`}>Seguimiento y retroalimentación</Link></li>
                        <li><Link href="/especialistas/cobertura-curricular" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/cobertura-curricular') ? styles.activeLink : ''}`}>Cobertura curricular</Link></li>
                      </>
                    )}
                    <li><Link href="/especialistas/agregar-directores" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/agregar-directores') ? styles.activeLink : ''}`}>Crear directivo</Link></li>
                  </ul>
                </li>

                {/* Docentes */}
                {!currentUserData.nivelDeInstitucion?.includes(2) && (
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
                      <li><Link href="/especialistas/evaluaciones-docentes" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/evaluaciones-docentes') ? styles.activeLink : ''}`}>Seguimiento y retroalimentación</Link></li>
                      <li><Link href="/especialistas/cobertura-curricular-master" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/cobertura-curricular-master') ? styles.activeLink : ''}`}>Cobertura curricular</Link></li>
                    </ul>
                  </li>
                )}

                {/* Docentes (Usuarios) */}
                <li className={styles.menuItem}>
                  <div className={styles.menuHeader} onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('docentes-usuarios');
                  }}>
                    <FaUserGraduate className={styles.icon} />
                    <span className={styles.link}>Docentes</span>
                    <IoIosArrowDown className={`${styles.arrowIcon} ${openDropdown === 'docentes-usuarios' ? styles.arrowRotate : ''}`} />
                  </div>
                  <ul className={`${styles.submenu} ${openDropdown === 'docentes-usuarios' ? styles.show : ''}`}>
                    <li><Link href="/admin/docentes/usuarios" className={`${styles.submenuLink} ${router.pathname.includes('/admin/docentes/usuarios') ? styles.activeLink : ''}`}>Usuarios</Link></li>
                  </ul>
                </li>

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
                    <li><Link href="/especialistas/evaluaciones" className={`${styles.submenuLink} ${router.pathname.includes('/especialistas/evaluaciones') ? styles.activeLink : ''}`}>Seguimiento de aprendizaje</Link></li>
                  </ul>
                </li>

                {/* Autorreporte */}
                <li className={styles.menuItem}>
                  <div className={`${styles.dashboardMenuItem} ${router.pathname.includes('/especialistas/autoreporte') ? styles.activeLink : ''}`} style={{ margin: 0, padding: "12px 20px" }}>
                    <LuListTodo className={styles.dashboardIcon} />
                    <Link className={styles.dashboardLink} href="/especialistas/autoreporte" aria-haspopup="true">
                      Autorreporte
                    </Link>
                  </div>
                </li>
              </ul>
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

export default SidebarEspecialistas